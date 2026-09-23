import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MODEL,
  GEMINI_MODELS,
  normalizeChatConfig,
} from '../chatSupportConstants'

describe('normalizeChatConfig のモデル', () => {
  it('Geminiは選択肢に無い', () => {
    expect(GEMINI_MODELS).toHaveLength(0)
  })

  it('保存値がGeminiのモデルならgpt-6-lunaに戻す', () => {
    for (const model of ['gemini-2.5-flash', 'gemini-1.5-flash']) {
      expect(normalizeChatConfig({ model }).model).toBe('gpt-6-luna')
    }
    expect(DEFAULT_MODEL).toBe('gpt-6-luna')
  })

  it('OpenAIのモデルはそのまま残す', () => {
    expect(normalizeChatConfig({ model: 'gpt-6-luna' }).model).toBe(
      'gpt-6-luna'
    )
  })
})
