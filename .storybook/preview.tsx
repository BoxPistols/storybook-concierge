import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo, useRef } from 'react'

import { ChatSupport } from '@/ChatSupport'
import { DocsContainer } from '@storybook/addon-docs/blocks'
import { themes as sbThemes } from 'storybook/theming'

import { DEFAULT_THEME_MODE, themes, type ThemeMode } from '@/theme/theme'

import type { Preview, StoryFn, StoryContext } from '@storybook/react-vite'

/**
 * Docs ページの枠をテーマに追従させるコンテナ。
 *
 * parameters.docs.theme は静的なので、globals では切り替わらない。
 * DocsContainer を包んで、現在の globals から SB のテーマを選ぶ
 */
const DocsContainerWithTheme = ({
  context,
  children,
}: {
  context: React.ComponentProps<typeof DocsContainer>['context']
  children: React.ReactNode
}) => {
  const mode =
    (
      context as unknown as {
        store?: { userGlobals?: { globals?: Record<string, unknown> } }
      }
    ).store?.userGlobals?.globals?.theme ?? DEFAULT_THEME_MODE
  return (
    <DocsContainer
      context={context}
      theme={mode === 'light' ? sbThemes.light : sbThemes.dark}>
      {children}
    </DocsContainer>
  )
}

/**
 * 全 Story に Concierge (ChatSupport) を注入する Decorator。
 *
 * - 現在表示中の Story のメタ情報 (title / name / description / argTypes / args)
 *   を ChatSupport に渡し、AI が「いま画面にあるもの」を前提に回答できるようにする
 * - Docs ページでは注入しない（1 ページに複数 Story が並び、文脈が一意でないため）
 * - ChatSupport 自身のデモ Story では `parameters.disableDecoratorChat: true` で
 *   オプトアウトできる（Decorator 側と二重レンダリングになるのを防ぐ）
 */
const Decorator = (Story: StoryFn, context: StoryContext) => {
  // ツールバーの globals で切り替える。既定は dark
  const mode = (context.globals.theme as ThemeMode) ?? DEFAULT_THEME_MODE
  const theme = themes[mode] ?? themes[DEFAULT_THEME_MODE]

  const storyTitle = context.title
  const storyName = context.name
  const storyDescription = context.parameters?.docs?.description?.component

  // argTypes / args は Controls 操作で頻繁に変わるため useMemo の依存配列には
  // 含めない。currentStory の参照安定性を保ち、ChatSupport 側の不要な再計算を防ぐ。
  const argTypesRef = useRef(context.argTypes)
  const argsRef = useRef(context.args)
  argTypesRef.current = context.argTypes
  argsRef.current = context.args

  const currentStory = useMemo(
    () => ({
      title: storyTitle,
      name: storyName,
      description: storyDescription,
      // argTypes / args は ref 経由で渡すことで、Controls 変化による再レンダリングを回避
      argTypes: argTypesRef.current as Record<string, unknown> | undefined,
      args: argsRef.current as Record<string, unknown> | undefined,
    }),
    [storyTitle, storyName, storyDescription]
  )

  const disableDecoratorChat = context.parameters?.disableDecoratorChat === true

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 部品は自分のテーマの面の上に置く。Storybook の chrome（サイドバー・
          Docs）は dark 固定なので、light を選んだときに部品だけ明るい面に
          乗るのが正しい見え方になる。

          width:100% が要る: Docs の .docs-story は display:flex で、
          幅指定の無い子は内容幅まで縮む。これを忘れると背景が
          幅 118px の縦帯として描かれる（実測して判明） */}
      <div
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}>
        <Story {...context} />
      </div>
      {context.viewMode !== 'docs' && !disableDecoratorChat && (
        <ChatSupport currentStory={currentStory} />
      )}
    </ThemeProvider>
  )
}

const preview: Preview = {
  /**
   * ツールバーのテーマ切替。既定は dark。
   *
   * Storybook 側の chrome（サイドバー・Docs）は manager.ts と
   * parameters.docs.theme で別途 dark にしてある。3 つの層が
   * 揃っていないと「サイドバーだけ白い」「Docs だけ白い」になる
   */
  globalTypes: {
    theme: {
      description: 'テーマ（既定: dark）',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: DEFAULT_THEME_MODE,
  },

  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: { headingSelector: 'h2, h3' },
      autodocs: true,
      // Docs ページ（Storybook が描く枠）もテーマに追従させる。
      // 固定にすると light を選んだとき「暗い枠に暗い文字」になる
      container: DocsContainerWithTheme,
    },
    // 背景アドオンは無効にする。
    // テーマ切替と背景切替の 2 つがツールバーに並ぶと、片方だけ変えたときに
    // 「暗いテーマなのに地が明るい」状態を作れてしまう。
    // 地の色は CssBaseline がテーマから塗るので、切替口は Theme 一つでよい
    backgrounds: { disable: true },
  },

  decorators: [Decorator],
}

export default preview
export { Decorator }
