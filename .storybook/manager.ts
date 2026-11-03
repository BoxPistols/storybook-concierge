import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

import { DEFAULT_THEME_MODE } from '../src/theme/theme'

/**
 * Storybook の chrome（サイドバー・ツールバー・検索）をテーマに追従させる。
 *
 * ここは preview（Canvas の中）とは**完全に別の world** で、preview.tsx の
 * ThemeProvider は届かない。
 *
 * 当初は dark 固定にしていたが、それだと Light を選んだときに
 * 「chrome は暗いのに部品だけ明るい」という中途半端な状態になり、
 * さらに Docs では **暗い枠に暗い文字**（枠は SB の dark 固定、文字色は
 * MUI の light テーマ由来）という読めない組み合わせが生じた。
 * 切替は全層で揃える。
 */

const BRAND = {
  brandTitle: 'Storybook Concierge',
  brandUrl: 'https://github.com/BoxPistols/storybook-concierge',
  brandTarget: '_blank',
} as const

const sbTheme = (mode: string | undefined) => ({
  ...(mode === 'light' ? themes.light : themes.dark),
  ...BRAND,
})

// Storybook はページ遷移のたびに document.title を「… ⋅ Storybook」で
// 上書きし、この接尾辞は設定で変えられない。タブや履歴で他の Storybook と
// 見分けられるよう、書き換えられた直後に接尾辞だけ差し替える
const SB_SUFFIX = ' \u22C5 Storybook'
const brandDocumentTitle = () => {
  if (document.title.endsWith(SB_SUFFIX)) {
    document.title = `${document.title.slice(0, -SB_SUFFIX.length)} \u22C5 ${BRAND.brandTitle}`
  } else if (document.title === 'Storybook') {
    document.title = BRAND.brandTitle
  }
}
document.documentElement.lang = 'ja'
brandDocumentTitle()
new MutationObserver(brandDocumentTitle).observe(document.head, {
  subtree: true,
  childList: true,
  characterData: true,
})

addons.setConfig({ theme: sbTheme(DEFAULT_THEME_MODE) })

// globals の変更に追従する。addons.setConfig は後から呼んでも反映される
addons.register('concierge/theme-sync', (api) => {
  const apply = () => {
    const mode = api.getGlobals?.()?.theme as string | undefined
    addons.setConfig({ theme: sbTheme(mode) })
  }
  // 起動直後の値（URL の globals 等）を拾う
  apply()
  api.on('globalsUpdated', apply)
})

// 入口の story には Controls が無く、下のアドオンパネルは空の枠になる。
// 初見の画面を本文とチャットに使うため、この story にいる間だけ閉じる。
// 閉じたのがこちらの場合に限り、他の story へ移ったら元に戻す
const START_STORY_ID = 'guide-start-here--start-here'
addons.register('concierge/start-here-layout', (api) => {
  let hiddenByUs = false
  const sync = () => {
    const onStart = api.getUrlState().storyId === START_STORY_ID
    if (onStart && api.getIsPanelShown()) {
      api.togglePanel(false)
      hiddenByUs = true
    } else if (!onStart && hiddenByUs) {
      api.togglePanel(true)
      hiddenByUs = false
    }
  }
  // 初回表示では storyChanged が来ないことがあるので、描画完了でも確かめる
  api.on('storyChanged', sync)
  api.on('storyRendered', sync)
})
