import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from '@mui/material'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
MUI 標準の Card コンポーネントの実用例です。お知らせカードを題材に、
**CardHeader（タイトル）+ CardContent（本文）+ CardActions（操作ボタン）** の組み合わせ方を示します。

- \`variant="outlined"\` で影なしの枠線スタイルになります（このデモの既定）
- カードの幅はカード自身ではなく**親側で制御**します（この例では maxWidth を指定）
- 操作ボタンは CardActions にまとめ、主要アクションを右端に置きます

このページを開いたままチャットに「Card の構成要素は？」と聞くと、この Story の文脈で回答します。
        `.trim(),
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevation', 'outlined'],
      description: 'elevation は影付き、outlined は枠線のみ',
    },
  },
  args: {
    variant: 'outlined',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** お知らせカードの実用例。Header + Content + Actions の基本構成 */
export const NotificationCard: Story = {
  render: (args) => (
    <Card {...args} sx={{ maxWidth: 400 }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>C</Avatar>}
        title='リリースのお知らせ'
        subheader='2026-08-15'
        action={<Chip label='新着' color='primary' size='small' />}
      />
      <CardContent>
        <Stack spacing={1}>
          <Typography variant='body2' color='text.secondary'>
            Concierge チャットにキーボードショートカットのカスタマイズ機能が
            追加されました。設定パネルから各操作のキー割り当てを変更できます。
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            詳細はチャットで「ショートカット」と質問すると確認できます。
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button size='small'>あとで読む</Button>
        <Button size='small' variant='contained'>
          詳細を見る
        </Button>
      </CardActions>
    </Card>
  ),
}
