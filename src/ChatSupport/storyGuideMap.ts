/**
 * 各Storybookページの解説データ
 * ChatSupport（Concierge）が「今見ている画面」の文脈で回答するために使用
 *
 * 方針:
 * - 実際のソースコード（src/theme/theme.ts, src/stories/ 等）に基づくデータを含める
 * - MUI公式ドキュメントURLを含める
 * - 汎用的な説明ではなく、このデモリポジトリ固有の情報を優先する
 */

export interface StoryGuideEntry {
  /** ページの要約（1-2文） */
  summary: string
  /** 実装の具体的な情報（コード参照先、実際の値など） */
  codeContext: string[]
  /** MUI公式ドキュメント等の関連URL */
  references?: string[]
  /** 関連するStorybookページ */
  related?: string[]
}

/**
 * story title をキーにしたガイドマップ
 * title は Storybook meta の title（例: "Guide/Getting Started"）
 */
export const STORY_GUIDE_MAP: Record<string, StoryGuideEntry> = {
  // --- Guide ---
  'Guide/Getting Started': {
    summary:
      'このデモの入口。Concierge（AIチャット）の使い方とStorybookの基本操作を説明する。',
    codeContext: [
      'チャット本体: src/ChatSupport/ 配下。画面右下のボタンで開閉する',
      '注入方法: .storybook/preview.tsx の Decorator が全 Story にチャットを配置',
      'ページ文脈: 現在の Story の title / description / args がチャットに渡り、「これは何？」に文脈込みで回答できる',
      'AI キー未設定でも動く: ローカル FAQ（src/ChatSupport/faqDatabase.ts）が回答を返す',
      'API キー設定: .env に VITE_OPENAI_API_KEY 等を記述（.env.example 参照、実値はコミットしない）',
    ],
    references: ['https://storybook.js.org/docs'],
    related: ['Components/Button', 'Components/Alert', 'Tokens/Colors'],
  },

  // --- Components ---
  'Components/Button': {
    summary:
      'MUI Button のデモ。variant / color / size を Controls パネルで変更できる。',
    codeContext: [
      'ストーリー: src/stories/Button.stories.tsx',
      'variant: text / outlined / contained の 3 種',
      'color: primary / secondary / success / error / warning / info',
      'size: small / medium / large',
      'テーマの primary は #0057B8（src/theme/theme.ts）',
      'Controls タブで args を変更するとリアルタイムに反映される',
    ],
    references: ['https://mui.com/material-ui/react-button/'],
    related: ['Components/Card', 'Components/Alert', 'Tokens/Colors'],
  },
  'Components/Card': {
    summary:
      'MUI Card の実用例。CardHeader / CardContent / CardActions の組み合わせ方を示す。',
    codeContext: [
      'ストーリー: src/stories/Card.stories.tsx',
      '構成: CardHeader（タイトル・サブヘッダー）+ CardContent（本文）+ CardActions（ボタン群）',
      'variant="outlined" で影なしの枠線スタイルにできる',
      '幅は親側で制御する（この例では maxWidth を指定）',
    ],
    references: ['https://mui.com/material-ui/react-card/'],
    related: ['Components/Button', 'Components/Alert'],
  },
  'Components/Alert': {
    summary:
      'MUI Alert のデモ。severity 4 種（success / info / warning / error）の使い分けを示す。',
    codeContext: [
      'ストーリー: src/stories/Alert.stories.tsx',
      'severity: success（完了）/ info（情報）/ warning（注意）/ error（失敗）',
      'variant: standard / outlined / filled の 3 種',
      'AlertTitle で見出しを追加できる',
      '色はテーマの success / info / warning / error パレットに追従する',
    ],
    references: ['https://mui.com/material-ui/react-alert/'],
    related: ['Components/Button', 'Tokens/Colors'],
  },

  // --- Tokens ---
  'Tokens/Colors': {
    summary:
      'テーマのカラーパレット見本。createTheme が解決した実際の色値を表示する。',
    codeContext: [
      'ストーリー: src/stories/Colors.stories.tsx',
      'テーマ定義: src/theme/theme.ts（primary.main = #0057B8 のみ指定、他は MUI 既定値）',
      '各カラーは main / light / dark / contrastText の 4 値セット',
      'セマンティックカラー: success / info / warning / error',
      '色はハードコードせず sx={{ color: "primary.main" }} のようにトークン名で参照する',
    ],
    references: [
      'https://mui.com/material-ui/customization/palette/',
      'https://mui.com/material-ui/customization/color/',
    ],
    related: ['Components/Button', 'Components/Alert'],
  },
}

/**
 * story title から最も適合するガイドエントリを取得
 * 完全一致→前方一致 の順で検索
 */
export const findStoryGuide = (storyTitle: string): StoryGuideEntry | null => {
  // 完全一致
  if (STORY_GUIDE_MAP[storyTitle]) {
    return STORY_GUIDE_MAP[storyTitle]
  }

  // 前方一致（ストーリー名のバリエーション対応）
  for (const [key, entry] of Object.entries(STORY_GUIDE_MAP)) {
    if (storyTitle.startsWith(key)) {
      return entry
    }
  }

  return null
}
