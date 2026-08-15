import { createTheme } from '@mui/material/styles'

import { motionTransitions, reducedMotionOverrides } from './motion'

/**
 * 最小の MUI テーマ。
 *
 * - primary は落ち着いた青 (#0057B8) 系
 * - ベースフォントサイズは 14px 相当。htmlFontSize と MuiCssBaseline の
 *   html { font-size } を揃えることで rem 計算と実描画を一致させる
 * - transitions はモーション体系 (motion.ts) をそのまま適用
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0057B8',
    },
  },
  typography: {
    htmlFontSize: 14,
    fontSize: 14,
  },
  transitions: motionTransitions,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: 14,
        },
        ...reducedMotionOverrides,
      },
    },
  },
})

export default theme
