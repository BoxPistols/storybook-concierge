// CORS 設定
//
// 許可の判断は 3 段階:
//
// 1. **同一オリジン** — Origin のホストがリクエスト自身のホストと一致するなら許可。
//    ブラウザは同一オリジンの POST でも Origin ヘッダを送るため、ここを
//    見落とすと**自分自身のサイトが 403 になる**（実際に本番で踏んだ:
//    デプロイ直後の storybook-concierge.vercel.app が Origin not allowed）。
//    allowlist は「他所のサイトに鍵を使わせない」ためのもので、
//    自分自身は対象外。設定なしで通るのが正しい
// 2. localhost / 127.0.0.1 — 開発用に常時許可
// 3. ALLOWED_ORIGINS（カンマ区切りの完全一致）— 別ドメインから叩く場合だけ設定する
//
// wildcard は使わない。

const LOCALHOST_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
]

// ALLOWED_ORIGINS の例:
//   ALLOWED_ORIGINS=https://your-org.github.io,https://docs.example.com
// スキーム込みのオリジンを完全一致で照合する（trailing slash は付けない）
const getAllowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** Origin ヘッダからホスト部（host:port）を取り出す */
const hostOf = (origin: string): string | null => {
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}

/**
 * リクエスト自身のホスト。
 *
 * Vercel / 一般的なプロキシ配下では実際のホストが x-forwarded-host に入る。
 * host は内部のホスト名になることがあるので、forwarded を優先する。
 */
export const requestHost = (headers: {
  host?: string | string[] | undefined
  'x-forwarded-host'?: string | string[] | undefined
}): string | null => {
  const pick = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v
  const forwarded = pick(headers['x-forwarded-host'])
  const host = pick(headers.host)
  // カンマ区切りで複数入ることがある。最初のものが元のリクエスト
  const raw = (forwarded ?? host)?.split(',')[0]?.trim()
  return raw || null
}

export const isAllowedOrigin = (
  origin: string | undefined | null,
  selfHost?: string | null
): boolean => {
  if (!origin) return false
  // 1. 同一オリジン
  if (selfHost) {
    const oh = hostOf(origin)
    if (oh && oh === selfHost) return true
  }
  // 2. ローカル開発
  if (LOCALHOST_PATTERNS.some((pattern) => pattern.test(origin))) return true
  // 3. 明示的な allowlist
  return getAllowedOrigins().includes(origin)
}

interface ResponseLike {
  setHeader: (name: string, value: string) => void
}

export const setCorsHeaders = (
  res: ResponseLike,
  origin: string | undefined | null,
  selfHost?: string | null
): void => {
  if (origin && isAllowedOrigin(origin, selfHost)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-API-Key')
  res.setHeader(
    'Access-Control-Expose-Headers',
    'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  )
  res.setHeader('Access-Control-Max-Age', '86400')
}
