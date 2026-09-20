import { describe, expect, it, vi, afterEach } from 'vitest'

import { FAQ_DATABASE } from '../faqDatabase'
import {
  FAQ_PICK_CONFIDENCE_MIN,
  buildFaqCriteria,
  pickFaqWithAi,
  toFaqPick,
} from '../faqPick'

// 型付き判定でFAQを選ぶ経路の検査。判定の正しさ自体は docs/faq-pick-ai.md の実測で測る。
// ここで止めるのは、静かに壊れる2つの形。受け皿(none)を落として無関係な質問に
// FAQを返してしまうことと、失敗時に既存の検索へ落ちずにチャットが止まることの2つ。

describe('buildFaqCriteria', () => {
  it('FAQの数だけ選択肢を作り、受け皿を必ず入れる', () => {
    const criteria = buildFaqCriteria(FAQ_DATABASE)
    expect(Object.keys(criteria)).toHaveLength(FAQ_DATABASE.length + 1)
    expect(criteria.none).toBeTruthy()
    expect(criteria.faq0).toContain(FAQ_DATABASE[0].title)
    // キーワードを説明に入れる。入れないと言い換えに弱くなる
    expect(criteria.faq0).toContain(FAQ_DATABASE[0].keywords[0])
  })
})

describe('toFaqPick', () => {
  const count = FAQ_DATABASE.length

  it('選ばれたFAQの添字を返す', () => {
    expect(toFaqPick({ choice: 'faq3', confidence: 0.99 }, count)).toEqual({
      index: 3,
      confidence: 0.99,
    })
  })

  it('受け皿が選ばれたら選ばない', () => {
    expect(
      toFaqPick({ choice: 'none', confidence: 0.99 }, count).index
    ).toBeNull()
  })

  it('confidenceがしきい値未満なら選ばない（実測で外れた1件は0.56だった）', () => {
    expect(
      toFaqPick({ choice: 'faq0', confidence: 0.56 }, count).index
    ).toBeNull()
    expect(
      toFaqPick({ choice: 'faq0', confidence: FAQ_PICK_CONFIDENCE_MIN }, count)
        .index
    ).toBe(0)
  })

  it('範囲外や壊れた応答では選ばない', () => {
    expect(
      toFaqPick({ choice: 'faq999', confidence: 1 }, count).index
    ).toBeNull()
    expect(
      toFaqPick({ choice: 'unknown', confidence: 1 }, count).index
    ).toBeNull()
    expect(toFaqPick(undefined, count).index).toBeNull()
  })
})

describe('pickFaqWithAi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('応答をそのまま返す', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ index: 2, confidence: 0.98 }),
      })
    )
    await expect(pickFaqWithAi('質問')).resolves.toEqual({
      index: 2,
      confidence: 0.98,
    })
  })

  it('キー未設定（501）や通信の失敗ではnullを返し、呼び出し側を止めない', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 501 })
    )
    await expect(pickFaqWithAi('質問')).resolves.toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(pickFaqWithAi('質問')).resolves.toBeNull()
  })
})
