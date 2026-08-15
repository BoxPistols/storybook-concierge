#!/usr/bin/env node
/**
 * 導入先の Storybook から storyGuideMap の下書きを生成する。
 *
 *   pnpm build-storybook
 *   node scripts/generate-story-guide.mjs > src/ChatSupport/storyGuideMap.generated.ts
 *
 * なぜ要るか:
 *
 * storyGuideMap は「このチャットが自社の Storybook を知っている」の実体だが、
 * 手で書くと導入の最大の障壁になる。Storybook は既に同じ情報を持っている
 * （index.json の title / name と、story ファイルの docs.description.component）ので、
 * そこから起こせば初回から自社の内容で答えられる。
 *
 * 生成物は**下書き**。summary は description か機械的な要約で、
 * codeContext は story ファイルのパスから推定した実装参照が入る。
 * 精度が要るページから人が上書きしていく前提。
 *
 * 何を推測していないか:
 * - コンポーネントの設計意図・命名理由・非推奨の経緯は Storybook に無い。
 *   生成物にそれらしい文章を書かない（AI が捏造の種にする）
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const STATIC_DIR = process.env.SB_STATIC ?? 'storybook-static'
const INDEX = join(STATIC_DIR, 'index.json')

if (!existsSync(INDEX)) {
  console.error(
    `${INDEX} がありません。先に build-storybook を実行してください。\n` +
      'SB_STATIC=<dir> で出力先を変えられます。'
  )
  process.exit(1)
}

const index = JSON.parse(readFileSync(INDEX, 'utf8'))
const entries = Object.values(index.entries).filter((e) => e.type === 'story')

if (entries.length === 0) {
  console.error('index.json に story が 1 件もありません。')
  process.exit(1)
}

/**
 * story ファイルから meta の docs 説明を取り出す。
 *
 * パースではなく正規表現で拾う。ここで AST を持ち出すと導入先の
 * TS 設定差で壊れるほうが痛い。取れなければ空を返して、
 * 「取れなかった」ことが生成物から分かるようにする
 */
const readDescription = (importPath) => {
  const file = resolve(process.cwd(), importPath.replace(/^\.\//, ''))
  if (!existsSync(file)) return null
  const src = readFileSync(file, 'utf8')
  // description: { component: ... } の component を拾う。
  // 終端を [,}] で縛ると、テンプレートリテラル内の改行やコードブロックで
  // 途切れる（実際に 5 ページ中 0 件しか取れなかった）。
  // クォート種別ごとに閉じだけで切る
  const m =
    src.match(/component:\s*`([\s\S]*?)`/) ??
    src.match(/component:\s*'((?:[^'\\]|\\.)*)'/) ??
    src.match(/component:\s*"((?:[^"\\]|\\.)*)"/)
  if (!m?.[1]) return null
  // **最初の段落だけ**を採る。全文を潰して長さで切ると、Markdown の表や
  // 箇条書きが途中から混ざって意味を成さない文字列になる
  // （実際 'severity 用途 ------ \' のような要約が出た）
  const firstParagraph = m[1]
    .replace(/```[\s\S]*?```/g, '') // コードブロックは落とす
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^[#\-*|>]/.test(p)) // 見出し・箇条書き・表で始まる塊は飛ばす
  if (!firstParagraph) return null
  const flat = firstParagraph
    .replace(/[*`]/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
  // 末尾がバックスラッシュだと生成コードのエスケープが壊れる
  return flat ? flat.slice(0, 300).replace(/\\+$/, '').trim() : null
}

// title ごとにまとめる（storyGuideMap のキーは title）
const byTitle = new Map()
for (const e of entries) {
  const cur = byTitle.get(e.title) ?? {
    title: e.title,
    names: [],
    importPath: e.importPath,
  }
  cur.names.push(e.name)
  byTitle.set(e.title, cur)
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const blocks = []
let withDescription = 0

for (const { title, names, importPath } of byTitle.values()) {
  const description = readDescription(importPath)
  if (description) withDescription++

  const summary = description ?? `${title} のコンポーネント。`
  const codeContext = [
    `Story: ${names.join(' / ')}`,
    `定義: ${importPath.replace(/^\.\//, '')}`,
  ]

  blocks.push(
    [
      `  '${esc(title)}': {`,
      `    summary: '${esc(summary)}',`,
      `    codeContext: [`,
      ...codeContext.map((c) => `      '${esc(c)}',`),
      `    ],`,
      `  },`,
    ].join('\n')
  )
}

const header = `// 自動生成: scripts/generate-story-guide.mjs
//
// 生成元は Storybook の index.json と、各 story ファイルの
// parameters.docs.description.component。
// ${byTitle.size} ページ中 ${withDescription} ページで説明文が取れた。
//
// **これは下書き。** 説明が取れなかったページは title からの機械的な文章に
// なっているので、重要なページから人が書き足すこと。
// codeContext には実際のファイルパス・実際の値を書くと回答の質が上がる。

import type { StoryGuideEntry } from './storyGuideMap'

export const GENERATED_STORY_GUIDE_MAP: Record<string, StoryGuideEntry> = {
`

console.log(header + blocks.join('\n') + '\n}\n')
console.error(
  `  ${byTitle.size} ページ分を生成（説明文が取れたのは ${withDescription} ページ）`
)
