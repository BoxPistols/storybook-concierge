import path from 'node:path'

import { defineConfig } from 'vitest/config'

// node 環境の最小構成。対象は lib/ と src/ の __tests__ のみ。
// DOM が要るテストが増えたらファイル冒頭の `// @vitest-environment` で
// 個別に切り替える（全体の環境は変えない）。
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'lib/**/__tests__/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'storybook-static/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
