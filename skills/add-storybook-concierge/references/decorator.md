# Decorator の配線

`.storybook/preview.tsx` に追加する。**既存の decorators 配列と parameters は保持し、追加する**。丸ごと置き換えない。

```tsx
import { useMemo, useRef } from 'react'
import { ChatSupport } from '@/ChatSupport' // or './src/ChatSupport'
import type { StoryFn, StoryContext } from '@storybook/react-vite'

const ConciergeDecorator = (Story: StoryFn, context: StoryContext) => {
  const storyTitle = context.title
  const storyName = context.name
  const storyDescription = context.parameters?.docs?.description?.component

  // Controls を触るたびに args / argTypes は新しい参照になる。
  // useMemo の依存配列に入れると currentStory が毎回作り直され、
  // 後段のメモ化が全部無効になる。ref で最新値だけ持つ
  const argTypesRef = useRef(context.argTypes)
  const argsRef = useRef(context.args)
  argTypesRef.current = context.argTypes
  argsRef.current = context.args

  const currentStory = useMemo(
    () => ({
      title: storyTitle,
      name: storyName,
      description: storyDescription,
      argTypes: argTypesRef.current as Record<string, unknown> | undefined,
      args: argsRef.current as Record<string, unknown> | undefined,
    }),
    [storyTitle, storyName, storyDescription]
  )

  const disabled = context.parameters?.disableDecoratorChat === true

  return (
    <>
      <Story {...context} />
      {/* Docs は 1 ページに複数 Story が並ぶ。ガードが無いと FAB が Story の数だけ生える */}
      {context.viewMode !== 'docs' && !disabled && (
        <ChatSupport currentStory={currentStory} />
      )}
    </>
  )
}
```

## 落とすと事後に気づきにくい 3 点

|                        | 落とすとどうなるか                                    |
| ---------------------- | ----------------------------------------------------- |
| `useRef` パターン      | Controls を触るたびに再計算。動くので気づかない       |
| `viewMode !== 'docs'`  | Docs タブで FAB が Story の数だけ重複する             |
| `disableDecoratorChat` | チャット自身の Story を書いたとき二重描画・state 競合 |

## MUI の ThemeProvider

導入先に ThemeProvider があれば、その配下に置けばテーマが効く。無い場合は Concierge が MUI の既定テーマで描画される（動作はする）。
