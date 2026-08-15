#!/usr/bin/env node
/**
 * 実描画のコントラストを **両テーマ**で検査する（WCAG 2.1 1.4.3）。
 *
 *   pnpm build-storybook
 *   npx http-server storybook-static -p 6206 --silent >/dev/null 2>&1 &
 *   pnpm check:contrast
 *
 * なぜ両テーマを測るか:
 *
 * light だけ測っていると、**dark にしたときだけ壊れる書き方**が素通りする。
 * 「塗り面に白文字を固定する」がその典型で、light では main が濃色なので
 * 成立し、dark で main が明るくなった瞬間に 2.5:1 前後まで落ちる。
 * 片方だけ測るのは、測っていないのとあまり変わらない。
 *
 * なぜ axe でなく自前の計算か:
 *
 * 半透明を合成してから測る必要がある。素の backgroundColor を使うと、
 * 淡い色を敷いた面の上の文字を実際より低く見積もる。
 * 計算部（scripts/lib/contrast-audit.mjs）は SVG の下地・祖先の
 * アルファ合成・背景画像の判定不能扱いまで含めて検証済みのもの。
 */

import { chromium } from 'playwright'

import { CONTRAST_AUDIT } from './lib/contrast-audit.mjs'

const URL = process.env.VERIFY_URL ?? 'http://localhost:6206'
const THEMES = (process.env.THEMES ?? 'dark,light')
  .split(',')
  .map((t) => t.trim())
/** これ未満しか判定できていない story は、描画されていないとみなす */
const MIN_JUDGED = 3

let index
try {
  index = await (await fetch(`${URL}/index.json`)).json()
} catch {
  console.error(
    `❌ Storybook が配信されていません (${URL})\n` +
      '   pnpm build-storybook してから静的配信してください。'
  )
  process.exit(1)
}
const stories = Object.values(index.entries).filter((e) => e.type === 'story')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const fails = new Map()
let judged = 0
let empty = 0

for (const theme of THEMES) {
  for (const s of stories) {
    await page.goto(
      `${URL}/iframe.html?id=${s.id}&viewMode=story&globals=theme:${theme}`,
      { waitUntil: 'load', timeout: 20000 }
    )
    await page.waitForTimeout(500)
    // チャットを開いてパネルの中まで測る。閉じたままだと FAB しか見ない
    try {
      await page.click('.MuiFab-root', { timeout: 3000 })
      await page.waitForTimeout(600)
    } catch {
      // FAB が無い story（オプトアウト）はそのまま測る
    }

    const r = await page.evaluate(CONTRAST_AUDIT)
    // 「違反 0 件」が測った上での 0 かを確かめる。
    // 描画に失敗した画面は何も測らずに 0 件を返す
    if (r.total < MIN_JUDGED) {
      empty++
      console.error(
        `  ⚠ [${theme}] ${s.id}: 判定できた文字要素が ${r.total} 個しかない`
      )
      continue
    }
    judged += r.total

    for (const f of r.fails.filter((x) => !x.disabled)) {
      const key = `${theme}|${f.got}|${f.need}|${f.label}|${f.color}|${f.bg}`
      const prev = fails.get(key)
      fails.set(key, {
        ...f,
        theme,
        n: (prev?.n ?? 0) + 1,
        samples: [...new Set([...(prev?.samples ?? []), f.text])].slice(0, 3),
        where: prev?.where ?? s.title,
      })
    }
  }
}

await browser.close()

const rows = [...fails.values()].sort((a, b) => a.got - b.got)
const count = rows.reduce((a, r) => a + r.n, 0)

console.log(
  `${THEMES.join(' + ')} / ${stories.length} story × ${THEMES.length} テーマ / ` +
    `判定した文字要素 ${judged} 個`
)
for (const r of rows) {
  console.log(
    `  [${r.theme}] ${r.got}:1 (要 ${r.need}) ${r.size}px ×${r.n}  ${r.color} on ${r.bg}\n` +
      `      ${r.label} @${r.where}  例: ${r.samples.map((s) => `"${s}"`).join(' ')}`
  )
}

if (empty) {
  console.error(`\n⚠ ${empty} 件を判定できませんでした。緑とみなせません。`)
  process.exit(1)
}
if (count) {
  console.error(
    `\n❌ コントラスト不足 ${count} 箇所 / ${rows.length} パターン\n` +
      '   塗り面の前景に白を固定していないか確認してください。' +
      'palette の contrastText を使えば両テーマで成立します。'
  )
  process.exit(1)
}
console.log(`\n✅ ${THEMES.join(' + ')} ともコントラスト不足なし`)
