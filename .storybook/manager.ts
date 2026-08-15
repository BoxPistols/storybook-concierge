import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

/**
 * Storybook の chrome（サイドバー・ツールバー・検索）を dark にする。
 *
 * ここは **preview（Canvas の中）とは完全に別の world** で、preview.tsx の
 * ThemeProvider は一切届かない。manager を設定し忘れると、Canvas だけ暗くて
 * サイドバーが白いという中途半端な状態になる。
 *
 * manager の見た目は利用者ごとの好みでもあるため、Storybook 本体の
 * ダークテーマをそのまま使い、独自の配色は当てない。
 */
addons.setConfig({
  theme: themes.dark,
})
