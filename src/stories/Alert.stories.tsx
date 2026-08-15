import { Alert, AlertTitle, Stack } from '@mui/material'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
MUI 標準の Alert コンポーネントのデモです。**severity 4 種**の使い分けを示します。

| severity | 用途 |
|---|---|
| \`success\` | 操作の完了（保存しました 等） |
| \`info\` | 補足情報（メンテナンス予定 等） |
| \`warning\` | 注意喚起（期限が近い 等） |
| \`error\` | 失敗・エラー（保存できませんでした 等） |

色はテーマの success / info / warning / error パレットに追従します。
\`variant\`（standard / outlined / filled）と \`AlertTitle\` の組み合わせも Controls で確認できます。
        `.trim(),
      },
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['success', 'info', 'warning', 'error'],
      description: 'アラートの意味。色とアイコンが変わる',
    },
    variant: {
      control: 'select',
      options: ['standard', 'outlined', 'filled'],
      description: '見た目のスタイル',
    },
    children: {
      control: 'text',
      description: 'メッセージ本文',
    },
  },
  args: {
    severity: 'info',
    variant: 'standard',
    children: '本日 22 時からメンテナンスを予定しています。',
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

/** Controls パネルで severity / variant を変更できるプレイグラウンド */
export const Playground: Story = {}

/** severity 4 種の一覧。意味に対応する色とアイコンが自動で付く */
export const AllSeverities: Story = {
  render: (args) => (
    <Stack spacing={2}>
      <Alert {...args} severity='success'>
        <AlertTitle>成功</AlertTitle>
        設定を保存しました。
      </Alert>
      <Alert {...args} severity='info'>
        <AlertTitle>情報</AlertTitle>
        本日 22 時からメンテナンスを予定しています。
      </Alert>
      <Alert {...args} severity='warning'>
        <AlertTitle>注意</AlertTitle>
        API キーの有効期限が近づいています。
      </Alert>
      <Alert {...args} severity='error'>
        <AlertTitle>エラー</AlertTitle>
        保存に失敗しました。時間をおいて再試行してください。
      </Alert>
    </Stack>
  ),
}
