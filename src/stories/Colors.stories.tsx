import { Box, Divider, Stack, Typography } from '@mui/material'

import { theme } from '@/theme/theme'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Tokens/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
テーマのカラーパレット見本です。\`src/theme/theme.ts\` の createTheme が解決した**実際の色値**を表示しています
（このデモで明示指定しているのは \`primary.main = #0057B8\` のみ。他は MUI の既定値です）。

- 各カラーは \`main\` / \`light\` / \`dark\` / \`contrastText\` の 4 値セット
- \`success\` / \`info\` / \`warning\` / \`error\` は**意味ベース**のセマンティックカラー
- コードでは色をハードコードせず、\`sx={{ color: 'primary.main' }}\` のように**トークン名で参照**します

チャットに「primary の色は何？」と聞くと、このページの文脈で回答します。
        `.trim(),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const PALETTE_KEYS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
] as const

const TONE_KEYS = ['main', 'light', 'dark', 'contrastText'] as const

const GREY_KEYS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const

/** テーマの全パレットを色見本として一覧表示する */
export const Palette: Story = {
  render: () => (
    <Stack spacing={4} sx={{ maxWidth: 840 }}>
      {PALETTE_KEYS.map((key) => {
        const colorSet = theme.palette[key]
        return (
          <Box key={key}>
            <Typography variant='h6' sx={{ mb: 1.5, textTransform: 'none' }}>
              {key}
            </Typography>
            <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
              {TONE_KEYS.map((tone) => (
                <Box key={tone} sx={{ width: 132 }}>
                  <Box
                    sx={{
                      height: 56,
                      borderRadius: 1,
                      bgcolor: colorSet[tone],
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                  <Typography
                    variant='caption'
                    component='div'
                    sx={{ mt: 0.5 }}>
                    {key}.{tone}
                  </Typography>
                  <Typography
                    variant='caption'
                    component='div'
                    color='text.secondary'
                    sx={{ fontFamily: 'monospace' }}>
                    {colorSet[tone]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )
      })}

      <Divider />

      <Box>
        <Typography variant='h6' sx={{ mb: 1.5 }}>
          grey
        </Typography>
        <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap>
          {GREY_KEYS.map((step) => (
            <Box key={step} sx={{ width: 72 }}>
              <Box
                sx={{
                  height: 44,
                  borderRadius: 1,
                  bgcolor: theme.palette.grey[step],
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant='caption' component='div' sx={{ mt: 0.5 }}>
                {step}
              </Typography>
              <Typography
                variant='caption'
                component='div'
                color='text.secondary'
                sx={{ fontFamily: 'monospace' }}>
                {theme.palette.grey[step]}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant='h6' sx={{ mb: 1.5 }}>
          text / background
        </Typography>
        <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
          {(
            [
              ['text.primary', theme.palette.text.primary],
              ['text.secondary', theme.palette.text.secondary],
              ['text.disabled', theme.palette.text.disabled],
              ['background.default', theme.palette.background.default],
              ['background.paper', theme.palette.background.paper],
              ['divider', theme.palette.divider],
            ] as const
          ).map(([label, value]) => (
            <Box key={label} sx={{ width: 148 }}>
              <Box
                sx={{
                  height: 44,
                  borderRadius: 1,
                  bgcolor: value,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant='caption' component='div' sx={{ mt: 0.5 }}>
                {label}
              </Typography>
              <Typography
                variant='caption'
                component='div'
                color='text.secondary'
                sx={{ fontFamily: 'monospace' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  ),
}
