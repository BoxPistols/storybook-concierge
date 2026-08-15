/**
 * ChatSupport が使う最小のモーション定義。
 *
 * このディレクトリを他プロジェクトへ丸ごとコピーするだけで動くように、
 * テーマ側（src/theme/motion.ts）へ依存させずここに閉じている。
 * 導入先が独自のモーション体系を持っているなら、この 2 つの定数を
 * そちらの値に差し替えれば全体が揃う。
 */

/** 動きの性格。値は cubic-bezier */
export const conciergeEasing = {
  /** 移動。両端がなめらか。画面内を動く要素に使う */
  standard: 'cubic-bezier(0.45, 0, 0.15, 1)',
} as const

/** 動きの長さ（ms） */
export const conciergeDuration = {
  /** 小さな要素の状態変化。ボタン・チップ・アイコン */
  micro: 120,
  /** 中くらいの要素。hover・ツールチップ */
  short: 180,
} as const

/**
 * transition プロパティの文字列を組み立てる。
 *
 * `prefers-reduced-motion` の尊重は導入先のグローバル CSS に任せる
 * （ここで個別に無効化すると、プロジェクト側の方針と二重管理になる）。
 */
export const motionOf = (
  properties: readonly string[],
  duration: keyof typeof conciergeDuration = 'micro',
  easing: keyof typeof conciergeEasing = 'standard'
) =>
  properties
    .map(
      (p) => `${p} ${conciergeDuration[duration]}ms ${conciergeEasing[easing]}`
    )
    .join(', ')
