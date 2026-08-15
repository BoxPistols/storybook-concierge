// CORS 設定
// - localhost / 127.0.0.1 は開発用に常時許可
// - デプロイ先のオリジンは環境変数 ALLOWED_ORIGINS（カンマ区切りの完全一致）で指定
// - 厳格な allowlist で wild card は使わない

const LOCALHOST_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
]

// ALLOWED_ORIGINS の例:
//   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-org.github.io
// スキーム込みのオリジンを完全一致で照合する（trailing slash は付けない）
const getAllowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const isAllowedOrigin = (origin: string | undefined | null): boolean => {
  if (!origin) return false
  if (LOCALHOST_PATTERNS.some((pattern) => pattern.test(origin))) return true
  return getAllowedOrigins().includes(origin)
}

interface ResponseLike {
  setHeader: (name: string, value: string) => void
}

export const setCorsHeaders = (
  res: ResponseLike,
  origin: string | undefined | null
): void => {
  if (origin && isAllowedOrigin(origin)) {
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
