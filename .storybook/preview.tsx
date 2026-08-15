import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo, useRef } from 'react'

import { ChatSupport } from '@/ChatSupport'
import { themes as sbThemes } from 'storybook/theming'

import { DEFAULT_THEME_MODE, themes, type ThemeMode } from '@/theme/theme'

import type { Preview, StoryFn, StoryContext } from '@storybook/react-vite'

const sbDark = sbThemes.dark

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
      {/* CssBaseline が body の背景をテーマ側に合わせる。
          これが無いと Storybook の白いキャンバスに暗いコンポーネントが乗り、
          「dark にしたのに地が白い」状態になる */}
      <CssBaseline />
      <div
        style={{
          padding: '1rem',
          minHeight: '100vh',
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
      // Docs ページ（Storybook が描く枠）も暗くする。
      // ここを忘れると Docs タブだけ白いままになる
      theme: sbDark,
    },
    // Canvas の地。テーマと合わせないと暗い部品が白地に乗る
    backgrounds: {
      options: {
        dark: { name: 'dark', value: '#18181b' },
        light: { name: 'light', value: '#f8fafc' },
      },
    },
  },

  decorators: [Decorator],
}

export default preview
export { Decorator }
