// ChatSupport FAQ知識ベース（デモ用）

import Fuse from 'fuse.js'

import { STORY_GUIDE_MAP } from './storyGuideMap'

import type { FaqEntry } from './chatSupportTypes'

// ---------------------------------------------------------------------------
// 同義語マップ: クエリ前処理で同義語をキーワードに展開
// ---------------------------------------------------------------------------

const SYNONYM_MAP: Record<string, string[]> = {
  色: ['カラー', 'color', 'パレット', 'palette'],
  鍵: ['APIキー', 'api key', 'キー', 'token'],
  設定: ['config', 'settings', '環境変数', 'env'],
  操作: ['使い方', 'operation'],
  部品: ['コンポーネント', 'component', 'パーツ'],
  質問: ['チャット', 'コンシェルジュ', 'AI', '聞く'],
  履歴: ['history', 'ダウンロード', 'クリア', '保存'],
  画面: ['ページ', 'ストーリー', 'story', 'Canvas'],
  動かない: ['エラー', 'トラブル', '応答しない', '失敗'],
  切替: ['トグル', 'toggle', '変更', 'モード'],
}

// ---------------------------------------------------------------------------
// FAQ: AI無しでも機能するローカル知識ベース
// ---------------------------------------------------------------------------

/**
 * どのプロジェクトに入れても真である FAQ。
 * チャット自体の操作と Storybook の一般的な使い方だけを扱う。
 * 導入先でそのまま使える（書き換え不要）
 */
export const CHAT_FAQ: FaqEntry[] = [
  {
    keywords: [
      'チャット',
      'コンシェルジュ',
      'concierge',
      '使い方',
      '質問',
      '開く',
      '閉じる',
      'ウィジェット',
    ],
    title: 'Concierge チャットの使い方',
    answer: `## Concierge チャットの使い方

画面右下の丸いボタンをクリックするとチャットが開きます。

### できること
| 機能 | 説明 |
|---|---|
| ページ文脈の質問 | 「これは何？」と聞くと **今見ている Story** を前提に回答 |
| FAQ 検索 | AI キー未設定でもローカル知識ベースが回答 |
| AI 回答 | API キーを設定すると LLM が詳細に回答 |
| クイック候補 | 入力欄上のボタンでよくある質問をワンクリック送信 |

### 基本操作
1. 入力欄に質問を書いて **Enter** で送信
2. **Escape** でチャットを閉じる
3. 設定パネル（歯車アイコン）で API キー・モデル・表示モードを変更

まずは「このページについて教えて」と聞いてみてください。`,
  },
  {
    keywords: [
      'API',
      'APIキー',
      'api key',
      'キー',
      '設定',
      'env',
      '環境変数',
      'OpenAI',
      'Google',
      'Gemini',
    ],
    title: 'API キーの設定方法',
    answer: `## API キーの設定方法

AI 回答を有効にするには、いずれかの方法でキーを渡します。**キーの実値をリポジトリにコミットしてはいけません。**

### 方法 1: .env ファイル（ローカル開発向け）
リポジトリ直下に \`.env\` を作成し、\`.env.example\` を参考に記述します。

\`\`\`bash
VITE_OPENAI_API_KEY=（自分のキー）
VITE_GOOGLE_GENERATIVE_AI_API_KEY=（自分のキー）
\`\`\`

\`.env\` は \`.gitignore\` 済みです。**公開ビルドでは環境変数のキーは自動的に空になる**ため、配布物にキーが混入することはありません。

### 方法 2: 設定パネル（ブラウザごと）
チャットの歯車アイコン → API キー欄に貼り付け。ブラウザの localStorage に保存され、サーバーには送られません。

### キーなしの場合
FAQ（この回答もそう）だけで動作します。AI 回答のみが無効になります。`,
  },
  {
    keywords: [
      'モデル',
      'model',
      '選択',
      'gpt',
      'gemini',
      '切替',
      'LLM',
      '変更',
    ],
    title: 'AI モデルの選択',
    answer: `## AI モデルの選択

設定パネル（歯車アイコン）のモデルセレクタで切り替えられます。

| プロバイダ | 必要なキー |
|---|---|
| OpenAI 系 | \`VITE_OPENAI_API_KEY\` |
| Google Gemini 系 | \`VITE_GOOGLE_GENERATIVE_AI_API_KEY\` |

### 選び方の目安
1. まずはデフォルトのモデルで試す
2. 応答が遅い・コストを抑えたい → 軽量モデルに切替
3. 選択したモデルに対応するキーが設定されているか確認する（未設定だと送信時にエラーになります）`,
  },
  {
    keywords: [
      'ショートカット',
      'shortcut',
      'キーボード',
      'keyboard',
      'キー操作',
      'ホットキー',
    ],
    title: 'キーボードショートカット',
    answer: `## キーボードショートカット

| 操作 | キー |
|---|---|
| メッセージ送信 | Enter |
| 入力欄にフォーカス | Cmd/Ctrl + / |
| チャット開閉 | Cmd/Ctrl + Shift + K |
| 設定パネル切替 | Cmd/Ctrl + Shift + X |
| 履歴ダウンロード | Cmd/Ctrl + Shift + D |
| サイドバー/ウィジェット切替 | Cmd/Ctrl + Shift + L |
| 履歴クリア | Cmd/Ctrl + Shift + Backspace |
| チャットを閉じる | Escape |

設定パネルからキー割り当てを変更できます。`,
  },
  {
    keywords: [
      'storybook',
      'ストーリーブック',
      '操作',
      'サイドバー',
      'canvas',
      'docs',
      '構成',
    ],
    title: 'Storybook の操作方法',
    answer: `## Storybook の操作方法

| 領域 | 役割 |
|---|---|
| **サイドバー**（左） | Story の一覧。クリックで表示切替 |
| **Canvas**（中央） | コンポーネントの実描画 |
| **Controls**（下） | props をリアルタイムに変更 |
| **Docs**（タブ） | 自動生成ドキュメント（autodocs） |

### このデモの構成
| セクション | 内容 |
|---|---|
| Guide/Getting Started | このデモの説明とチャットの使い方 |
| Components/Button・Card・Alert | MUI コンポーネントのデモ |
| Tokens/Colors | テーマのカラーパレット見本 |

## やるべきこと
1. まず **Guide > Getting Started** を読む
2. **Components > Button** で Controls パネルを触ってみる
3. 各ページでチャットに「これは何？」と聞いてみる`,
  },
  {
    keywords: [
      'controls',
      'コントロール',
      'args',
      'argTypes',
      'props',
      '変更',
      'ノブ',
    ],
    title: 'Controls パネルの使い方',
    answer: `## Controls パネルの使い方

Canvas 下部の **Controls** タブで、表示中のコンポーネントの props をリアルタイムに変更できます。

### 仕組み
| Story 側 | Controls での見え方 |
|---|---|
| \`args\` | 各コントロールの初期値 |
| \`argTypes\` | コントロールの型（select / boolean / text 等） |

\`\`\`tsx
// 例: src/stories/Button.stories.tsx
argTypes: {
  variant: { control: 'select', options: ['text', 'outlined', 'contained'] },
},
args: { variant: 'contained' },
\`\`\`

### ヒント
1. 変更した値はチャットにも渡るため、「今の variant は？」と聞くと現在値を答えられます
2. リセットは Controls パネル右上の巻き戻しアイコン`,
  },
  {
    keywords: [
      'オフライン',
      'AIなし',
      'キーなし',
      'FAQ',
      'ローカル',
      '動かない',
      'フォールバック',
      '応答しない',
    ],
    title: 'AI キーなしでも使える？（FAQ フォールバック）',
    answer: `## AI キーなしでも使える？

使えます。Concierge は 2 段構えで回答します。

| 段階 | 仕組み | キー |
|---|---|---|
| 1. ローカル FAQ | \`src/ChatSupport/faqDatabase.ts\` をキーワード + ファジー検索 | 不要 |
| 2. AI 回答 | 設定されたモデルの API を呼び出し | 必要 |

### AI が応答しないときの確認
1. 設定パネルで **API キーが入っているか** 確認
2. 選択中のモデルと **キーのプロバイダが一致しているか** 確認（OpenAI モデルに Gemini キーでは動きません）
3. ブラウザの開発者ツールの Console にエラーが出ていないか確認
4. FAQ だけで足りる質問なら、キーなしのまま使い続けても問題ありません`,
  },
  {
    keywords: [
      'autodocs',
      'ドキュメント',
      'docs',
      '自動生成',
      'description',
      'MDX',
    ],
    title: 'autodocs（自動ドキュメント）とは',
    answer: `## autodocs（自動ドキュメント）とは

Story に \`tags: ['autodocs']\` を付けると、Storybook が **Docs ページを自動生成** します。

### このデモでの書き方
\`\`\`tsx
const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'ここに書いた説明が Docs ページ冒頭に表示される',
      },
    },
  },
} satisfies Meta<typeof Button>
\`\`\`

### 表示される内容
1. \`description.component\` の説明文
2. 最初の Story のプレビュー
3. argTypes から生成された props 表
4. 残りの Story の一覧

Docs ページではチャットは表示されません（複数 Story が並び文脈が一意でないため）。`,
  },
]

/**
 * このデモ固有の FAQ。**導入先では丸ごと差し替える。**
 *
 * ここを残したまま他プロジェクトへ持ち込むと、存在しない Story や
 * 別プロジェクトの構成を自信満々に答える。分けてあるのは、
 * 「どれを消すか」を導入者に判断させないため
 */
export const PROJECT_FAQ: FaqEntry[] = [
  {
    keywords: [
      'カラー',
      '色',
      'color',
      'パレット',
      'テーマ',
      'theme',
      'primary',
      'トークン',
    ],
    title: 'カラーとテーマの確認方法',
    answer: `## カラーとテーマの確認方法

### 定義場所
テーマは \`src/theme/theme.ts\` で定義しています。指定しているのは \`primary.main = #0057B8\` のみで、他は MUI の既定値です。

### 見本の場所
Storybook → **Tokens > Colors** で、createTheme が解決した実際の色値を一覧できます。

### 使い方
\`\`\`tsx
// ハードコード禁止
<Button sx={{ bgcolor: '#0057B8' }}>NG</Button>

// トークン名で参照する
<Button sx={{ bgcolor: 'primary.main' }}>OK</Button>
\`\`\`

| トークン | 用途 |
|---|---|
| \`primary\` | 主要アクション |
| \`success / info / warning / error\` | セマンティック（意味ベース）カラー |
| \`text.primary / text.secondary\` | 本文・補助テキスト |`,
  },
  {
    keywords: [
      '構成',
      'リポジトリ',
      'ファイル',
      'ディレクトリ',
      '起動',
      'dev',
      'pnpm',
      'インストール',
    ],
    title: 'このデモの構成と起動方法',
    answer: `## このデモの構成と起動方法

### 起動
\`\`\`bash
pnpm install
pnpm storybook   # http://localhost:6206
\`\`\`

### 主要ディレクトリ
| パス | 内容 |
|---|---|
| \`src/ChatSupport/\` | Concierge チャット本体 |
| \`src/stories/\` | デモ用 Story（Button / Card / Alert / Colors） |
| \`src/theme/\` | MUI テーマとモーション定義 |
| \`.storybook/\` | Storybook 設定。preview.tsx が全 Story にチャットを注入 |
| \`api/\` | AI 呼び出しのバックエンドエンドポイント |
| \`.env.example\` | 環境変数のテンプレート（実値は書かない） |

### 自分のプロジェクトへの導入
\`skills/add-storybook-concierge/SKILL.md\` に導入手順があります。`,
  },
]

export const FAQ_DATABASE: FaqEntry[] = [...CHAT_FAQ, ...PROJECT_FAQ]

// ---------------------------------------------------------------------------
// 同義語展開: クエリに同義語を追加してマッチ率を向上
// ---------------------------------------------------------------------------

export const expandSynonyms = (query: string): string => {
  let expanded = query
  for (const [word, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (query.includes(word)) {
      expanded += ' ' + synonyms.join(' ')
    }
  }
  return expanded
}

// ---------------------------------------------------------------------------
// Fuse.js ファジーマッチ用インスタンス（遅延初期化）
// ---------------------------------------------------------------------------

let fuseInstance: Fuse<FaqEntry> | null = null

const getFuse = (): Fuse<FaqEntry> => {
  if (!fuseInstance) {
    fuseInstance = new Fuse(FAQ_DATABASE, {
      keys: [
        { name: 'keywords', weight: 2 },
        { name: 'title', weight: 1.5 },
        { name: 'answer', weight: 0.5 },
      ],
      threshold: 0.6,
      ignoreLocation: true,
      includeScore: true,
    })
  }
  return fuseInstance
}

// ---------------------------------------------------------------------------
// FAQ検索（同義語展開 → キーワードマッチ → Fuse.jsフォールバック）
// ---------------------------------------------------------------------------

export const findFaqAnswer = (query: string): string | null => {
  if (!query.trim()) return null

  // Step 1: 同義語展開 → キーワードマッチ（高速・確定的）
  const expanded = expandSynonyms(query)
  const q = expanded.toLowerCase()
  let best: { score: number; answer: string } | null = null
  for (const faq of FAQ_DATABASE) {
    let score = 0
    for (const kw of faq.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: faq.answer }
    }
  }

  // キーワードマッチで十分なスコアがあればそれを返す
  if (best && best.score >= 3) return best.answer

  // Step 2: Fuse.jsファジーマッチ（フォールバック）
  const fuse = getFuse()
  const results = fuse.search(query)
  if (results.length > 0 && results[0].score !== undefined) {
    // Fuse.jsのスコアは0に近いほど良い（canonical threshold: 0.45）
    if (results[0].score < 0.45) {
      return results[0].item.answer
    }
  }

  // キーワードマッチで低スコアでもあった場合はそれを返す
  if (best) return best.answer

  return null
}

// ---------------------------------------------------------------------------
// クイック候補・初期メッセージ
// ---------------------------------------------------------------------------

export const QUICK_SUGGESTIONS = [
  { label: 'チャットの使い方', query: 'チャットの使い方' },
  { label: 'APIキー設定', query: 'APIキーの設定方法' },
  { label: 'モデル選択', query: 'AIモデルの選択' },
  { label: 'ショートカット', query: 'キーボードショートカット' },
  { label: 'Storybookの操作', query: 'Storybookの操作方法' },
  { label: 'Controlsの使い方', query: 'Controlsパネルの使い方' },
  { label: 'カラートークン', query: 'カラーとテーマの確認方法' },
  { label: 'デモの構成', query: 'このデモの構成と起動方法' },
]

export const INITIAL_GREETING =
  'Storybook Concierge です。今見ているページやこのデモの使い方について質問できます。下のボタンか自由入力でどうぞ。'

// ---------------------------------------------------------------------------
// 動的サジェスト生成
// ---------------------------------------------------------------------------

export interface Suggestion {
  label: string
  query: string
}

const MAX_SUGGESTIONS = 6

// FAQ_DATABASEの小文字バージョンを事前計算（毎回toLowerCase()を呼ばない）
const FAQ_SEARCH_INDEX = FAQ_DATABASE.map((faq) => ({
  title: faq.title,
  titleLower: faq.title.toLowerCase(),
  keywordsLower: faq.keywords.map((kw) => kw.toLowerCase()),
}))

/**
 * 会話コンテキストから動的サジェストを生成(最大6件)
 * 優先度: レスポンス派生 > ページコンテキスト > 静的フォールバック
 */
export const generateSuggestions = (
  lastBotText: string | null,
  currentStoryTitle: string | null,
  usedQueries: Set<string>
): Suggestion[] => {
  const results: Suggestion[] = []
  const seen = new Set<string>()

  const add = (label: string, query: string): boolean => {
    if (results.length >= MAX_SUGGESTIONS) return false
    if (usedQueries.has(query) || seen.has(query)) return false
    seen.add(query)
    results.push({ label, query })
    return true
  }

  // 1. レスポンス派生: 直前のBot回答テキストからFAQタイトルをマッチング
  if (lastBotText) {
    const text = lastBotText.toLowerCase()
    for (const idx of FAQ_SEARCH_INDEX) {
      if (results.length >= MAX_SUGGESTIONS) break
      const titleMatch = text.includes(idx.titleLower)
      const keywordHits = idx.keywordsLower.filter((kw) =>
        text.includes(kw)
      ).length
      if (titleMatch || keywordHits >= 2) {
        add(idx.title, idx.title)
      }
    }
  }

  // 2. ページコンテキスト: currentStoryTitle の related からサジェスト生成
  if (currentStoryTitle) {
    const entry = STORY_GUIDE_MAP[currentStoryTitle]
    if (entry?.related) {
      for (const relatedTitle of entry.related) {
        if (results.length >= MAX_SUGGESTIONS) break
        // related はストーリータイトル("Guide/Getting Started"等)なので短縮ラベルを生成
        const label = relatedTitle.includes('/')
          ? (relatedTitle.split('/').pop() ?? relatedTitle)
          : relatedTitle
        add(label, `${relatedTitle} について教えて`)
      }
    }
  }

  // 3. 静的フォールバック: QUICK_SUGGESTIONS から未使用分を補充
  for (const s of QUICK_SUGGESTIONS) {
    if (results.length >= MAX_SUGGESTIONS) break
    add(s.label, s.query)
  }

  return results
}
