# 知識ベースを育てる

**この作業は必須ではない。** 何も書かなくても、Storybook が持つメタ情報（Story の `title` / `name` / `docs.description.component` / 現在の `args`）から、そのページについて答える。

## storyGuideMap — 下書きを自動生成する

```bash
pnpm build-storybook
node scripts/generate-story-guide.mjs > src/ChatSupport/storyGuideMap.generated.ts
```

`index.json` と各 Story ファイルの `docs.description.component`（**最初の段落**）から起こす。説明が書いてある Story ほど良い下書きになる。

生成物は下書き。重要なページから `codeContext` に実ファイルパス・実際の値を書き足すと回答の質が上がる。**推測で書かない** — AI が捏造の種にする。

## FAQ — 2 つの配列に分かれている

| 配列          | 扱い                                             |
| ------------- | ------------------------------------------------ |
| `CHAT_FAQ`    | チャット操作と Storybook 一般。そのまま使える    |
| `PROJECT_FAQ` | デモ固有。**丸ごと差し替える**（空配列でもよい） |

`PROJECT_FAQ` を残したまま持ち込むと、存在しない Story や別プロジェクトの構成を自信満々に答える。

## システムプロンプト

`chatSupportConstants.ts` の `SYSTEM_PROMPT`。回答の口調・禁止事項・参照させたいドキュメントを書く。
