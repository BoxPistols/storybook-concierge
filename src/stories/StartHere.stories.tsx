import { Box, Stack, Typography } from '@mui/material'

import type { Meta, StoryObj } from '@storybook/react-vite'

const STEPS = [
  {
    title: '「この画面なに？」と聞く',
    body: 'いま開いている story の title・説明・props を前提に答えます。API キーは要りません。',
  },
  {
    title: 'Components > Button に移って同じ質問をする',
    body: 'ページが変わると回答の前提も変わります。Controls で variant を変えてから「今の variant は？」と聞くと、変えた値を踏まえて答えます。',
  },
  {
    title: '設定（歯車）から自分の OpenAI キーを入れる',
    body: 'キーが無い間は FAQ とページガイドの曖昧検索で答え、キーを入れると LLM と Embedding による意味検索で自由な質問に答えます。',
  },
] as const

const meta = {
  title: 'Guide/Start here',
  parameters: {
    layout: 'padded',
    // 初見の人がチャットを探さずに済むよう、この story だけ開いた状態で始める
    concierge: { defaultOpen: true },
    docs: {
      description: {
        component:
          'Storybook Concierge の入口。右下のチャットで、いま開いているページについて質問できる。',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const StartHere: Story = {
  name: 'Start here',
  render: () => (
    <Stack
      component='main'
      spacing={4}
      sx={{ maxWidth: 440, py: { xs: 2, sm: 4 } }}>
      <Box>
        <Typography variant='overline' color='text.secondary'>
          Storybook Concierge
        </Typography>
        <Typography variant='h4' component='h1' sx={{ mt: 0.5, mb: 1.5 }}>
          Storybook の中で、いま見ている部品について聞けるチャット
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          チャットは画面右下にあります。閉じていたら右下の丸いボタン、または
          Cmd/Ctrl + Shift + K で開いてください。
        </Typography>
      </Box>

      <Stack
        component='ol'
        spacing={2.5}
        sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {STEPS.map((step, i) => (
          <Stack component='li' key={step.title} direction='row' spacing={2}>
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 1,
                borderColor: 'primary.main',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}>
              {i + 1}
            </Box>
            <Box>
              <Typography variant='subtitle1' component='p' fontWeight={700}>
                {step.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {step.body}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Stack>
  ),
}
