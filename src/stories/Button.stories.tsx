import { Button, Stack } from '@mui/material'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
MUI 標準の Button コンポーネントのデモです。**Controls パネルで variant / color / size を変更**して、
見た目の変化をリアルタイムに確認できます。

- **variant** — \`text\`（最も控えめ）/ \`outlined\`（枠線）/ \`contained\`（塗りつぶし、最も強調）
- **color** — \`primary\` を主要アクションに、\`error\` を破壊的操作に使うなど、**意味ベース**で選びます
- **size** — \`small\` / \`medium\` / \`large\`

Controls で値を変えた状態でチャットに「今の variant は？」と聞くと、現在の args を踏まえて回答します。
        `.trim(),
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'outlined', 'contained'],
      description: 'ボタンの見た目。強調度は text < outlined < contained',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'テーマパレットの色。意味ベースで選ぶ',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'ボタンのサイズ',
    },
    disabled: {
      control: 'boolean',
      description: '操作不可の状態',
    },
    children: {
      control: 'text',
      description: 'ボタンのラベル',
    },
  },
  args: {
    variant: 'contained',
    color: 'primary',
    size: 'medium',
    disabled: false,
    children: '保存する',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Controls パネルで自由に props を変更できるプレイグラウンド */
export const Playground: Story = {}

/** variant 3 種の比較。強調したい順に contained > outlined > text */
export const Variants: Story = {
  render: (args) => (
    <Stack direction='row' spacing={2}>
      <Button {...args} variant='contained'>
        contained
      </Button>
      <Button {...args} variant='outlined'>
        outlined
      </Button>
      <Button {...args} variant='text'>
        text
      </Button>
    </Stack>
  ),
}

/** size 3 種の比較 */
export const Sizes: Story = {
  render: (args) => (
    <Stack direction='row' spacing={2} alignItems='center'>
      <Button {...args} size='small'>
        small
      </Button>
      <Button {...args} size='medium'>
        medium
      </Button>
      <Button {...args} size='large'>
        large
      </Button>
    </Stack>
  ),
}
