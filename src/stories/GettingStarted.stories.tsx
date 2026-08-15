import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Guide/Getting Started',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Storybook Concierge** は、Storybook の中に住む AI コンシェルジュのデモです。
画面右下の丸いボタンをクリックするとチャットが開き、**今表示している Story を文脈として**質問に答えます。

## このデモでできること

- **ページ文脈の質問** — 「これは何？」「この variant は何ができる？」と聞くと、現在の Story の title / 説明 / props（args）を踏まえて回答します
- **FAQ 検索** — API キーを設定していなくても、ローカルの知識ベース（FAQ）が使い方・設定方法などに回答します
- **AI 回答** — \`.env\` に \`VITE_OPENAI_API_KEY\` などを設定するか、チャットの設定パネルにキーを入力すると、LLM による詳細な回答が有効になります（キーの実値はコミットしないでください。\`.env.example\` を参照）

## まず試すこと

1. 右下のボタンでチャットを開く
2. 「このページについて教えて」と送信する
3. サイドバーから **Components > Button** に移動し、Controls パネルで variant を変えてから「今の variant は？」と聞いてみる

## デモの構成

| セクション | 内容 |
|---|---|
| Guide / Getting Started | このページ。デモの説明とチャットの使い方 |
| Components / Button | variant・color・size を Controls で触れるデモ |
| Components / Card | Card の実用例 |
| Components / Alert | severity 4 種の使い分け |
| Tokens / Colors | テーマのカラーパレット見本 |

## 主なショートカット

| 操作 | キー |
|---|---|
| メッセージ送信 | Enter |
| チャット開閉 | Cmd/Ctrl + Shift + K |
| 入力欄にフォーカス | Cmd/Ctrl + / |
| チャットを閉じる | Escape |

なお、この Docs ページにはチャットは表示されません（1 ページに複数の Story が並び、文脈が一意にならないため）。
Canvas タブ、または各コンポーネントの Story で試してください。
        `.trim(),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Canvas で表示される導入ページ。右下のチャットを開いて試すための足場 */
export const Overview: Story = {
  render: () => (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto', py: 4 }}>
      <Box>
        <Typography variant='h4' component='h1' gutterBottom>
          Storybook Concierge
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Storybook の中に住む AI コンシェルジュのデモです。画面右下のボタンから
          チャットを開き、「このページについて教えて」と聞いてみてください。
        </Typography>
      </Box>

      <Divider />

      <Paper variant='outlined' sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom>
          3 ステップで試す
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Chip label='1' size='small' color='primary' />
            <Typography variant='body2'>
              右下の丸いボタンをクリックしてチャットを開く
            </Typography>
          </Stack>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Chip label='2' size='small' color='primary' />
            <Typography variant='body2'>
              「このページについて教えて」と送信する
            </Typography>
          </Stack>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Chip label='3' size='small' color='primary' />
            <Typography variant='body2'>
              Components &gt; Button に移動し、Controls で props
              を変えてから「今の variant は？」と聞く
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant='outlined' sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom>
          回答の仕組み
        </Typography>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>段階</TableCell>
              <TableCell>仕組み</TableCell>
              <TableCell>API キー</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>ローカル FAQ</TableCell>
              <TableCell>使い方・設定などの定型質問に即答</TableCell>
              <TableCell>不要</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>AI 回答</TableCell>
              <TableCell>今見ている Story の文脈を含めて LLM が回答</TableCell>
              <TableCell>必要（.env または設定パネル）</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      <Typography variant='caption' color='text.secondary'>
        API キーの実値はコミットせず、.env.example を参考に .env
        へ記述してください。詳しくは Docs タブの説明を参照してください。
      </Typography>
    </Stack>
  ),
}
