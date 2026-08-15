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

const sbTheme = (mode: string | undefined) =>
  mode === 'light' ? themes.light : themes.dark

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
