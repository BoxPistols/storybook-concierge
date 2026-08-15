const path = require('path')
const { fileURLToPath } = require('node:url')

const { mergeConfig, loadEnv } = require('vite')

/**
 * preventive: pnpm + Storybook 10 + MDX で addon-docs の MDX loader が
 * `file:///...@storybook/addon-docs/dist/mdx-react-shim.js` のような
 * file:// 絶対 URL で import を emit することがあり、Vite の
 * `vite:import-analysis` がこれを解決できず dev server でクラッシュする
 * (「Failed to fetch dynamically imported module」/「Failed to resolve import」)。
 * build は Rollup 経由で通るので CI 緑のまま dev だけ死ぬ latent bug。
 *
 * 対処: resolveId フックで file:// prefix を fileURLToPath で通常パスに変換。
 */
const fileUrlResolvePlugin = {
  name: 'concierge:resolve-file-url',
  enforce: 'pre',
  resolveId(source) {
    if (typeof source === 'string' && source.startsWith('file://')) {
      return fileURLToPath(source)
    }
    return null
  },
}

const config = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: false,
    check: false,
  },
  async viteFinal(config, { configType }) {
    // 環境変数を明示的に読み込む（.env ファイルから）
    const freshEnv = loadEnv(configType, path.resolve(__dirname, '..'), 'VITE_')

    return mergeConfig(config, {
      plugins: [fileUrlResolvePlugin],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
        },
      },
      // esbuild の target を esnext に上げて、
      // Storybook が注入する supported overrides (destructuring 強制降格) を回避
      build: {
        target: 'esnext',
      },
      // build.target は本番ビルドにしか効かない。dev サーバーの依存事前バンドルは
      // optimizeDeps 側の esbuild が担うため、同じ手当てをこちらにも入れる。
      // これが無いと @ai-sdk/gateway 等の destructuring が降格対象になり、
      // `storybook dev` が数千件のエラーで起動に失敗する。
      // @ai-sdk/gateway は本体依存の ai から来る
      // （`pnpm why @ai-sdk/gateway` で ai 6.x → @ai-sdk/gateway の 1 経路のみ）
      optimizeDeps: {
        esbuildOptions: {
          target: 'esnext',
          supported: { destructuring: true },
        },
      },
      // 環境変数を define に追加
      //
      // 資格情報は build（configType === 'PRODUCTION'）では常に空にする。
      // define した値はバンドルに平文で焼き込まれ、配信された時点で
      // 無認証の GET で誰でも取得できるため、共有ビルドに載せてはいけない。
      // 環境変数の設定漏れに頼らず、ビルド種別で機械的に落とす。
      // 公開ビルドで AI を動かす場合は api/ai.ts のバックエンド経由か、
      // 利用者が自分のキーを入力する運用（設定パネル）を使う。
      define: {
        'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(
          configType === 'PRODUCTION' ? '' : freshEnv.VITE_OPENAI_API_KEY || ''
        ),
        'import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY': JSON.stringify(
          configType === 'PRODUCTION'
            ? ''
            : freshEnv.VITE_GOOGLE_GENERATIVE_AI_API_KEY || ''
        ),
        'import.meta.env.VITE_OPENAI_MODEL': JSON.stringify(
          freshEnv.VITE_OPENAI_MODEL || 'gpt-5.6-luna'
        ),
      },
    })
  },
}

module.exports = config
