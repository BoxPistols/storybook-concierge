import { createTheme, type Theme } from '@mui/material/styles'

import { motionTransitions, reducedMotionOverrides } from './motion'

/**
 * 最小の MUI テーマ（light / dark）。
 *
 * **dark を既定**にしている。UI カタログは実装者が長時間見るものなので、
 * まず暗い面で成立することを確認したい。light も同じ品質で用意し、
 * ツールバーからいつでも切り替えられる。
 *
 * dark を後付けにすると、明るい面でだけ成立する書き方（塗り面に白文字を
 * 固定する等）が入り込み、暗くした瞬間に読めなくなる。最初から両方を
 * 並べて定義しておくと、その形の破綻が入りにくい。
 */

/** ベースフォントサイズ。htmlFontSize と実描画を一致させる */
const HTML_FONT_SIZE = 14

/**
 * primary。light では濃紺（白文字が 6.9:1）、dark では明るい青。
 *
 * dark で main をそのまま使うと暗面に沈むため明度を上げるが、その結果
 * **白文字が乗らなくなる**（実測 2.5:1 前後）。contrastText に濃色を
 * 明示して、塗り面の前景を白固定にしない。
 */
const primary = {
  light: { main: '#0057B8', contrastText: '#ffffff' },
  dark: { main: '#5AA9FF', contrastText: '#06182e' },
} as const

const shared = {
  typography: {
    htmlFontSize: HTML_FONT_SIZE,
    fontSize: HTML_FONT_SIZE,
  },
  transitions: motionTransitions,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { fontSize: HTML_FONT_SIZE },
        ...reducedMotionOverrides,
      },
    },
  },
} as const

export const lightTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: primary.light,
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
})

export const darkTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: primary.dark,
    background: { default: '#18181b', paper: '#27272a' },
    text: { primary: '#e4e4e7', secondary: '#a1a1aa' },
  },
})

/** ツールバーの値 → テーマ */
export const themes = { dark: darkTheme, light: lightTheme } as const

export type ThemeMode = keyof typeof themes

/** 既定は dark */
export const DEFAULT_THEME_MODE: ThemeMode = 'dark'

// 後方互換: 既定テーマを default export / named export で出す
export const theme = darkTheme
export default darkTheme
