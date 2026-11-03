#!/usr/bin/env node
/**
 * storybook build の出力 HTML を日本語のサイトとして仕上げる。
 *
 * Storybook のテンプレートは `<html lang="en">` 固定で、`<title>` も
 * 「<title プリセット> - Storybook」の形でしか出せない（manager-head.html
 * からは差し替えられない）。リンクの共有先や検索エンジンが JS を実行せずに
 * 読むのはこの静的 HTML なので、ビルド直後に置き換える。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TITLE = 'Storybook Concierge｜いま見ている部品について聞ける AI チャット'

const file = resolve(process.argv[2] ?? 'storybook-static/index.html')
const html = readFileSync(file, 'utf8')

const next = html
  .replace(/<html lang="[^"]*">/, '<html lang="ja">')
  .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)

if (
  !next.includes('<html lang="ja">') ||
  !next.includes(`<title>${TITLE}</title>`)
) {
  console.error(
    `finalize-static-html: ${file} の html/title を置き換えられなかった`
  )
  process.exit(1)
}

writeFileSync(file, next)
console.log(`finalize-static-html: ${file} を lang="ja" と固定タイトルに更新`)
