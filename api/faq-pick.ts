// Vercel Function: FAQ選択エンドポイント
// - ChatSupport から呼ばれ、質問にどのFAQが答えられるかを返す
// - サーバー側で TYPESAFE_API_KEY を保持し、ブラウザに露出させない
// - 返すのは添字とconfidenceだけ。回答の本文はクライアントが持つFAQから引く
// - キーが無ければ 501 を返す。クライアントは既存の findFaqAnswer に落とす

import { isAllowedOrigin, requestHost, setCorsHeaders } from '../lib/cors.js'
import { FAQ_DATABASE } from '../src/ChatSupport/faqDatabase.js'
import { buildFaqCriteria, toFaqPick } from '../src/ChatSupport/faqPick.js'

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MODEL = 'jev-latest'
const MAX_QUERY_LENGTH = 500

// 既存の api/ai.ts と同じく、@vercel/node に依存せず必要な形だけを書く
interface VercelRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: { query?: unknown } | string
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (data: unknown) => void
  end: (data?: unknown) => void
}

const headerToString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = headerToString(req.headers.origin)
  const selfHost = requestHost(req.headers)
  setCorsHeaders(res, origin, selfHost)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (
    process.env.NODE_ENV === 'production' &&
    !isAllowedOrigin(origin, selfHost)
  ) {
    res.status(403).json({ error: 'Origin not allowed', code: 'ORIGIN_DENIED' })
    return
  }

  const apiKey = process.env.TYPESAFE_API_KEY
  if (!apiKey) {
    // 未設定でも壊さない。クライアントは既存のキーワード検索に落ちる
    res.status(501).json({ error: 'TYPESAFE_API_KEY is not configured' })
    return
  }

  const body = (
    typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  ) as {
    query?: unknown
  }
  const query = typeof body?.query === 'string' ? body.query.trim() : ''
  if (!query || query.length > MAX_QUERY_LENGTH) {
    res
      .status(400)
      .json({ error: `query is required (1-${MAX_QUERY_LENGTH} chars)` })
    return
  }

  try {
    // 質問は1つだけ。FAQの題とキーワードを選択肢にし、受け皿のnoneを必ず入れる
    const upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: { 利用者の質問: query },
        model: MODEL,
        questions: {
          faq: {
            type: 'choice',
            instructions: 'この質問に答えられるFAQ',
            criteria: buildFaqCriteria(FAQ_DATABASE),
          },
        },
      }),
    })
    if (!upstream.ok) {
      res.status(502).json({ error: `upstream ${upstream.status}` })
      return
    }
    const json = (await upstream.json()) as {
      answers?: { faq?: { choice: string; confidence: number } }
    }
    res.status(200).json(toFaqPick(json.answers?.faq, FAQ_DATABASE.length))
  } catch {
    res.status(502).json({ error: 'upstream request failed' })
  }
}
