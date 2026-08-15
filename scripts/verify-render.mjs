#!/usr/bin/env node
/**
 * storybook-concierge の実描画検証（リポジトリの scripts/verify-render.mjs になる草案）
 *
 * SKILL.md の検証ゲート c〜e を機械化したもの:
 *   c. 実ブラウザで story を開き FAB が描画される
 *   d. docs ページで FAB が出ない（Decorator の viewMode ガード）
 *   e. API キー未設定で質問して FAQ / storyGuide 応答が返る
 *
 * 前提: build 済みの storybook-static を http://localhost:6206 で配信していること
 */
import { chromium } from 'playwright'

const URL = process.env.VERIFY_URL ?? 'http://localhost:6206'
const failures = []
const ok = (label) => console.log(`  ✅ ${label}`)
const ng = (label, detail) => {
  failures.push(label)
  console.error(`  ❌ ${label}${detail ? `: ${detail}` : ''}`)
}

let index
try {
  index = await (await fetch(`${URL}/index.json`)).json()
} catch {
  console.error(`❌ Storybook が配信されていません (${URL})`)
  process.exit(1)
}
const stories = Object.values(index.entries).filter((e) => e.type === 'story')
const docs = Object.values(index.entries).filter((e) => e.type === 'docs')
console.log(`  story ${stories.length} 件 / docs ${docs.length} 件`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// --- c: 全 story で FAB がちょうど 1 つ描画される -----------------------------
let fabOkCount = 0
for (const s of stories) {
  await page.goto(`${URL}/iframe.html?id=${s.id}&viewMode=story`, {
    waitUntil: 'load',
    timeout: 20000,
  })
  // FAB は登場アニメーション付き。確定を待つ
  await page.waitForTimeout(900)
  const fabs = await page.evaluate(
    () => document.querySelectorAll('.MuiFab-root').length
  )
  if (fabs === 1) fabOkCount++
  else ng(`FAB (${s.id})`, `${fabs} 個`)
}
if (fabOkCount === stories.length)
  ok(`FAB が全 ${stories.length} story でちょうど 1 つ`)

// --- d: docs ページに FAB が出ない -------------------------------------------
if (docs.length > 0) {
  await page.goto(`${URL}/iframe.html?id=${docs[0].id}&viewMode=docs`, {
    waitUntil: 'load',
    timeout: 20000,
  })
  await page.waitForTimeout(1200)
  const fabs = await page.evaluate(
    () => document.querySelectorAll('.MuiFab-root').length
  )
  if (fabs === 0) ok('docs ページに FAB なし（viewMode ガード動作）')
  else ng('docs の FAB 重複', `${fabs} 個`)
}

// --- e: キー無しで FAQ / storyGuide 応答 --------------------------------------
const target = stories[0]
await page.goto(`${URL}/iframe.html?id=${target.id}&viewMode=story`, {
  waitUntil: 'load',
  timeout: 20000,
})
await page.waitForTimeout(900)
await page.click('.MuiFab-root')
await page.waitForTimeout(600)
// MUI の multiline TextField は採寸用の隠し textarea を併置する
// （aria-hidden + readonly + height 0）。それを掴むと fill が永久に待つ
const input = page
  .locator('textarea:not([aria-hidden="true"]):not([readonly])')
  .first()
await input.waitFor({ state: 'visible', timeout: 10000 })
// 黙って飛ばさない。キーの有無で期待値が変わるので、どちらなのか必ず出す
const placeholder = (await input.getAttribute('placeholder')) ?? ''
if (placeholder.includes('FAQ')) ok('キー未設定 → FAQ モード表示')
else console.log(`  ℹ AI モード（キーあり）: "${placeholder}"`)
// 送信前のメッセージ数を記録し、増えたことで応答を判定する。
// 本文の文字列一致で見ると story 側の文言を拾う
// （Alert の story にある「エラー」を失敗と誤判定した）
const messages = page.getByTestId('concierge-messages')
const before = (await messages.innerText()).length
await input.fill('この画面なに？')
await input.press('Enter')
await page.waitForTimeout(3000)
const after = await messages.innerText()

const added = after.slice(before)

// 「増えたか」だけでは足りない。汎用 FAQ が返っても増えるので緑になる。
// 「タイトルを含むか」でも足りない: FAQ の本文に
// 「Components/Button・Card・Alert」のような一覧があり、そこに引っかかる。
// 実際この 2 段階の緩い検査が、AI 失敗時にページ説明を飛ばして FAQ へ
// 直行するバグを見逃していた（本番のスクリーンショットで気づいた）。
//
// ページ文脈の回答は「**<title>** > <name>」で始まる。そこまで見る
// 文字数で差分を取ると境界がずれる（単語の途中から始まる）ので、
// 全文に見出しが含まれるかで見る
const expected = `${target.title} > ${target.name}`
if (after.length <= before) {
  ng('ページ文脈の応答', '送信してもメッセージ領域が増えない')
} else if (/APIキーを設定|API キーを設定|接続に失敗/.test(added)) {
  ng('ページ文脈の応答', 'AI 未設定を理由に断られている')
} else if (!after.includes(expected)) {
  ng(
    'ページ文脈の応答',
    `"${expected}" を含まない。汎用 FAQ に落ちている: ${added.slice(0, 90).replace(/\s+/g, ' ')}`
  )
} else {
  ok(`ページ文脈の応答が返る（"${expected}"）`)
}

await browser.close()

if (failures.length) {
  console.error(`\n❌ ${failures.length} 件の検証が失敗`)
  process.exit(1)
}
console.log('\n✅ 実描画の検証すべて通過')
