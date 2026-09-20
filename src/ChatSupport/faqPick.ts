// FAQの選択を型付き判定のAPI（TypeSafe AIのJev）で行う。
//
// なぜ入れるか: いまの findFaqAnswer は、同義語の展開 → キーワード長の合算（閾値3）
// → Fuse.js（threshold 0.6、採用は score < 0.45）→ それでも駄目なら低スコアのbest、
// という3段になっている。語が一致しない言い換えに弱く、閾値が3つある。
//
// 実測（2026-09-20、jev-1.13.0）: 言い換えた質問20件とFAQに無い質問10件で比べた。
//   findFaqAnswer: 20件中12件正解。FAQに無い質問1件に誤って答えた
//   Jevのchoice:   20件中19件正解。FAQに無い質問には1件も答えなかった
// 2回続けて30件すべて同じ判定だった。唯一の外れはconfidence 0.56で、
// しきい値を0.6に置けばAIへ回す側に落ちる。詳細は docs/faq-pick-ai.md。
//
// 失敗したときは null を返す。呼び出し側は既存の findFaqAnswer に落とす。

import type { FaqEntry } from './chatSupportTypes'

/** これを下回ったら選ばない。実測で、外れた1件は0.56だった */
export const FAQ_PICK_CONFIDENCE_MIN = 0.6

export interface FaqPickResult {
  /** FAQ_DATABASE の添字。どれにも当てはまらなければ null */
  index: number | null
  confidence: number
}

/** 選択肢はFAQの題とキーワード、それに「どれでもない」の受け皿 */
export const buildFaqCriteria = (faqs: FaqEntry[]): Record<string, string> => ({
  ...Object.fromEntries(
    faqs.map((faq, i) => [
      `faq${i}`,
      `${faq.title}。関連する語: ${faq.keywords.join('、')}`,
    ])
  ),
  none: '上のどのFAQでも答えられない質問。このツールと関係のない話題を含む',
})

/**
 * APIの応答を添字に変える。
 * 受け皿（none）と、confidenceがしきい値未満のものは「選ばない」に倒す。
 */
export const toFaqPick = (
  answer: { choice: string; confidence: number } | undefined,
  faqCount: number,
  threshold = FAQ_PICK_CONFIDENCE_MIN
): FaqPickResult => {
  if (!answer) return { index: null, confidence: 0 }
  if (answer.confidence < threshold)
    return { index: null, confidence: answer.confidence }
  if (answer.choice === 'none')
    return { index: null, confidence: answer.confidence }
  const index = Number(answer.choice.replace('faq', ''))
  if (!Number.isInteger(index) || index < 0 || index >= faqCount) {
    return { index: null, confidence: answer.confidence }
  }
  return { index, confidence: answer.confidence }
}

/**
 * サーバー側の口（/api/faq-pick）に問い合わせる。
 * キーはサーバーが持ち、ブラウザには出さない。
 */
export const pickFaqWithAi = async (
  query: string,
  options: { signal?: AbortSignal; endpoint?: string } = {}
): Promise<FaqPickResult | null> => {
  try {
    const res = await fetch(options.endpoint ?? '/api/faq-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: options.signal,
    })
    if (!res.ok) return null
    const json = (await res.json()) as FaqPickResult
    if (typeof json?.index === 'undefined') return null
    return json
  } catch {
    // 通信の失敗でチャットを止めない。呼び出し側が既存の検索に落とす
    return null
  }
}
