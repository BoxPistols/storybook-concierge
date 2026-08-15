import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo, useRef } from 'react'

import { ChatSupport } from '@/ChatSupport'
import { theme } from '@/theme/theme'

import type { Preview, StoryFn, StoryContext } from '@storybook/react-vite'

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
      <div style={{ padding: '1rem' }}>
        <Story {...context} />
      </div>
      {context.viewMode !== 'docs' && !disableDecoratorChat && (
        <ChatSupport currentStory={currentStory} />
      )}
    </ThemeProvider>
  )
}

const preview: Preview = {
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
    },
  },

  decorators: [Decorator],
}

export default preview
export { Decorator }
