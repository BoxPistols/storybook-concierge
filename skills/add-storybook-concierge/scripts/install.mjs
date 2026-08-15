#!/usr/bin/env node
/**
 * Concierge を既存の Storybook に組み込む。機械的にできる部分を全部やる。
 *
 *   node install.mjs [--dry-run]
 *
 * やること:
 *   1. 導入先の環境を調べる（PM / Storybook / framework / MUI / エイリアス）
 *   2. 依存を追加する
 *   3. src/ChatSupport 一式をコピーする（ローカル or GitHub）
 *   4. 残りの手作業を「そのまま貼れる形」で出力する
 *
 * やらないこと:
 *   .storybook/main.* と preview.* の書き換え。既存の設定を壊す危険があるので、
 *   ここは中身を読める側（Claude / 人）に任せ、貼る内容だけ用意する。
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync, cpSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry-run')
const TARGET = process.cwd()

const say = (s) => console.log(s)
const die = (s) => {
  console.error(`\n❌ ${s}`)
  process.exit(1)
}

// --- 1. 環境を調べる ---------------------------------------------------------

const pkgPath = join(TARGET, 'package.json')
if (!existsSync(pkgPath)) {
  die(
    'カレントディレクトリに package.json がありません。\n' +
      '   npm / npx は上位ディレクトリの package.json をルートと誤認するので、\n' +
      '   導入先のプロジェクト直下で実行してください。'
  )
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
// peerDependencies も見る。ライブラリ的なプロジェクトは MUI を peer に置く
// （kaze-ux がそうで、これを見落として「MUI 未導入」と誤判定した）
const deps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies,
}

const pm = existsSync(join(TARGET, 'pnpm-lock.yaml'))
  ? 'pnpm'
  : existsSync(join(TARGET, 'yarn.lock'))
    ? 'yarn'
    : existsSync(join(TARGET, 'bun.lockb'))
      ? 'bun'
      : 'npm'

const sbVersion = deps.storybook ?? deps['@storybook/react-vite'] ?? null
const isViteFramework = !!deps['@storybook/react-vite']
const hasMui = !!deps['@mui/material']
const hasEmotion = !!deps['@emotion/react']

const sbDir = ['.storybook', 'config/storybook'].find((d) =>
  existsSync(join(TARGET, d))
)
const mainFile = sbDir
  ? ['main.ts', 'main.tsx', 'main.js', 'main.cjs', 'main.mjs']
      .map((f) => join(TARGET, sbDir, f))
      .find(existsSync)
  : null
const previewFile = sbDir
  ? ['preview.tsx', 'preview.ts', 'preview.jsx', 'preview.js']
      .map((f) => join(TARGET, sbDir, f))
      .find(existsSync)
  : null

// src ディレクトリと @ エイリアスの有無
const srcDir = ['src', 'app', 'lib'].find((d) => existsSync(join(TARGET, d)))
const tsconfig = ['tsconfig.json', 'tsconfig.app.json']
  .map((f) => join(TARGET, f))
  .find(existsSync)

say('環境:')
say(`  パッケージマネージャ  ${pm}`)
say(`  Storybook             ${sbVersion ?? '見つからない'}`)
say(
  `  framework             ${isViteFramework ? '@storybook/react-vite' : '不明 / vite 以外'}`
)
say(`  設定ディレクトリ      ${sbDir ?? '見つからない'}`)
say(
  `  main                  ${mainFile ? mainFile.replace(TARGET + '/', '') : '見つからない'}`
)
say(
  `  preview               ${previewFile ? previewFile.replace(TARGET + '/', '') : '見つからない'}`
)
say(`  MUI                   ${hasMui ? deps['@mui/material'] : '未導入'}`)
say(`  コピー先              ${srcDir ? `${srcDir}/ChatSupport` : '不明'}`)
say('')

// --- 前提の判定 --------------------------------------------------------------

if (!sbDir || !mainFile || !previewFile) {
  die(
    'Storybook の設定が見つかりません（.storybook/main.* と preview.*）。\n' +
      '   Storybook を導入してから実行してください。'
  )
}
if (!isViteFramework) {
  die(
    'このスキルは @storybook/react-vite 専用です。\n' +
      '   webpack5 / Next.js framework では viteFinal への追記が効きません。'
  )
}
if (!srcDir) {
  die('src / app / lib のいずれも見つかりません。コピー先を決められません。')
}

// --- 2. 依存 -----------------------------------------------------------------

const REQUIRED = {
  ai: '^6.0.246',
  '@ai-sdk/openai': '^3.0.91',
  '@ai-sdk/google': '^3.0.104',
  'react-markdown': '^10.1.0',
  'remark-gfm': '^4.0.1',
  'prism-react-renderer': '^2.4.1',
  'fuse.js': '^7.5.0',
  'lucide-react': '^0.577.0',
}
const UI = {
  '@mui/material': '^7.2.0',
  '@emotion/react': '^11.14.0',
  '@emotion/styled': '^11.14.1',
}

const missing = Object.entries(REQUIRED).filter(([k]) => !deps[k])
const missingUi = Object.entries(UI).filter(([k]) => !deps[k])

if (missingUi.length) {
  say('⚠ MUI が未導入です。')
  say('  Concierge の UI は MUI v7 の基本部品 27 種で書かれています。')
  say('  （Box / Paper / Button / TextField / Typography / Dialog など）')
  say('  導入先が Tailwind などで統一されている場合、チャット 1 つのために')
  say('  UI ライブラリを増やすことになります。承知のうえで進めてください。')
  say('')
}

const toInstall = [...missing, ...missingUi].map(([k, v]) => `${k}@${v}`)
if (toInstall.length) {
  const cmd = `${pm} ${pm === 'npm' ? 'install' : 'add'} ${toInstall.join(' ')}`
  say(`依存を追加: ${toInstall.length} 件`)
  if (DRY) {
    say(`  (dry-run) ${cmd}`)
  } else {
    say(`  ${cmd}`)
    execSync(cmd, { cwd: TARGET, stdio: 'inherit' })
  }
  say('')
} else {
  say('依存: すべて導入済み\n')
}

// --- 3. ChatSupport をコピー -------------------------------------------------

const dest = join(TARGET, srcDir, 'ChatSupport')
// このスキルがリポジトリ内にあればローカルから、無ければ GitHub から
const localSource = resolve(HERE, '../../../src/ChatSupport')
const fromLocal = existsSync(join(localSource, 'ChatSupport.tsx'))

if (existsSync(dest)) {
  say(`コピー先が既にあります: ${srcDir}/ChatSupport（上書きしません）`)
} else if (DRY) {
  say(
    `(dry-run) ${fromLocal ? 'ローカル' : 'GitHub'} から ${srcDir}/ChatSupport へコピー`
  )
} else if (fromLocal) {
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(localSource, dest, { recursive: true })
  say(`コピー: ローカル → ${srcDir}/ChatSupport`)
} else {
  execSync(
    `npx --yes degit BoxPistols/storybook-concierge/src/ChatSupport "${dest}"`,
    { cwd: TARGET, stdio: 'inherit' }
  )
  say(`コピー: GitHub → ${srcDir}/ChatSupport`)
}
// テストは持ち込まない（導入先の vitest 設定に依存するため）
say('')

// --- 4. 残りの手作業を出力 ---------------------------------------------------

const aliasOk = tsconfig && /"@\/\*"/.test(readFileSync(tsconfig, 'utf8'))
const importPath = aliasOk ? '@/ChatSupport' : `./${srcDir}/ChatSupport`

say('--- ここから先は 2 ファイルの編集が要ります --------------------------')
say('')
say(`1. ${mainFile.replace(TARGET + '/', '')} の viteFinal に追記`)
say('   （既存設定を消さないよう mergeConfig を使う。丸ごと置換しないこと）')
say('')
say(`   ${'`'}${'`'}${'`'}js`)
say("   const { mergeConfig } = require('vite')  // ESM なら import")
say('')
say('   // viteFinal の戻り値に:')
say('   return mergeConfig(config, {')
say("     build: { target: 'esnext' },")
say('     // dev サーバーの依存事前バンドルは build.target が効かない。')
say('     // これが無いと ai@6 の依存の destructuring が降格され')
say('     // `storybook dev` だけが大量のエラーで起動しなくなる')
say('     optimizeDeps: {')
say('       esbuildOptions: {')
say("         target: 'esnext',")
say('         supported: { destructuring: true },')
say('       },')
say('     },')
say('   })')
say(`   ${'`'}${'`'}${'`'}`)
say('')
say(`2. ${previewFile.replace(TARGET + '/', '')} に Decorator を追加`)
say(`   参照: skills/add-storybook-concierge/references/decorator.md`)
say(`   import 元: '${importPath}'`)
say('')
say('--- 完了後 ----------------------------------------------------------')
say('')
say(`  ${pm} run build-storybook   # ビルドが通るか`)
say(
  `  ${pm} run storybook         # dev も起動するか（別経路。ここだけ落ちる事故がある）`
)
say('')
say('  実ブラウザでの確認は scripts/verify-render.mjs が使えます。')
say('')
