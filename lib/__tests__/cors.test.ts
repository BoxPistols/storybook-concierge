import { afterEach, describe, expect, it } from 'vitest'

import { isAllowedOrigin, requestHost, setCorsHeaders } from '../cors'

const withEnv = (value: string | undefined, fn: () => void) => {
  const prev = process.env.ALLOWED_ORIGINS
  if (value === undefined) delete process.env.ALLOWED_ORIGINS
  else process.env.ALLOWED_ORIGINS = value
  try {
    fn()
  } finally {
    if (prev === undefined) delete process.env.ALLOWED_ORIGINS
    else process.env.ALLOWED_ORIGINS = prev
  }
}

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS
})

describe('requestHost', () => {
  it('x-forwarded-host を host より優先する', () => {
    expect(
      requestHost({ host: 'internal:3000', 'x-forwarded-host': 'example.com' })
    ).toBe('example.com')
  })

  it('カンマ区切りは最初のものを使う', () => {
    expect(
      requestHost({ 'x-forwarded-host': 'example.com, proxy.internal' })
    ).toBe('example.com')
  })

  it('配列ヘッダーも扱える', () => {
    expect(requestHost({ host: ['example.com'] })).toBe('example.com')
  })

  it('どちらも無ければ null', () => {
    expect(requestHost({})).toBeNull()
  })
})

describe('isAllowedOrigin', () => {
  describe('同一オリジン', () => {
    // ブラウザは同一オリジンの POST でも Origin を送る。ここを通さないと
    // デプロイした自分自身のサイトが 403 になる（本番で実際に踏んだ）
    it('ALLOWED_ORIGINS 未設定でも自分自身は許可する', () => {
      withEnv(undefined, () => {
        expect(
          isAllowedOrigin('https://example.vercel.app', 'example.vercel.app')
        ).toBe(true)
      })
    })

    it('ポート付きでも host が一致すれば許可する', () => {
      withEnv(undefined, () => {
        expect(
          isAllowedOrigin('http://example.com:8080', 'example.com:8080')
        ).toBe(true)
      })
    })

    it('ホストが違えば許可しない', () => {
      withEnv(undefined, () => {
        expect(
          isAllowedOrigin('https://evil.example', 'example.vercel.app')
        ).toBe(false)
      })
    })

    it('サブドメイン違いを同一とみなさない', () => {
      withEnv(undefined, () => {
        expect(isAllowedOrigin('https://evil.example.com', 'example.com')).toBe(
          false
        )
      })
    })
  })

  describe('localhost', () => {
    it('ポートの有無に関わらず許可する', () => {
      withEnv(undefined, () => {
        expect(isAllowedOrigin('http://localhost:6206')).toBe(true)
        expect(isAllowedOrigin('http://127.0.0.1')).toBe(true)
      })
    })
  })

  describe('ALLOWED_ORIGINS', () => {
    it('完全一致したものだけ許可する', () => {
      withEnv('https://docs.example.com', () => {
        expect(isAllowedOrigin('https://docs.example.com')).toBe(true)
        // 前方一致で通してはいけない
        expect(isAllowedOrigin('https://docs.example.com.evil.test')).toBe(
          false
        )
      })
    })
  })

  it('Origin 無しは許可しない', () => {
    expect(isAllowedOrigin(undefined, 'example.com')).toBe(false)
  })

  it('壊れた Origin で例外を投げない', () => {
    expect(isAllowedOrigin('not a url', 'example.com')).toBe(false)
  })
})

describe('setCorsHeaders', () => {
  const collect = () => {
    const headers: Record<string, string> = {}
    return {
      headers,
      res: { setHeader: (k: string, v: string) => void (headers[k] = v) },
    }
  }

  it('許可したオリジンにだけ Allow-Origin を返す', () => {
    const a = collect()
    setCorsHeaders(a.res, 'https://example.com', 'example.com')
    expect(a.headers['Access-Control-Allow-Origin']).toBe('https://example.com')
    expect(a.headers['Vary']).toBe('Origin')

    const b = collect()
    setCorsHeaders(b.res, 'https://evil.example', 'example.com')
    expect(b.headers['Access-Control-Allow-Origin']).toBeUndefined()
  })
})
