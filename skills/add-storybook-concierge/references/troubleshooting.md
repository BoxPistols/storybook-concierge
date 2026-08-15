# 落ちたときに見る場所

| 症状                                  | 疑うところ                                                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build-storybook` が失敗              | import パス（`@` エイリアスの有無）/ 依存の入れ忘れ                                                                                                                                                                        |
| **`storybook dev` だけ起動しない**    | `optimizeDeps.esbuildOptions` の追記漏れ。build と dev は別経路で、dev の依存事前バンドルに `build.target` は効かない。`ai@6` の依存が destructuring 降格で壊れる。設定変更後は `rm -rf node_modules/.vite` してから再起動 |
| FAB が出ない                          | Decorator が `decorators` 配列に入っていない / 既存 Decorator との合成で注入部が落ちている                                                                                                                                 |
| Docs で FAB が重複                    | `context.viewMode !== 'docs'` ガードの漏れ                                                                                                                                                                                 |
| キー無しで質問しても FAQ しか返らない | 期待どおり。ページ文脈の応答は「この画面なに？」のような聞き方で出る                                                                                                                                                       |
| ページ文脈の応答が汎用 FAQ になる     | AI 失敗時のフォールバック順序。ページ説明 → FAQ の順を保つ                                                                                                                                                                 |
| バンドルにキーが焼き込まれる          | `main` の `define` が本番ビルドで空にならない。`configType === 'PRODUCTION'` の分岐を確認                                                                                                                                  |

## 検証を自動で回す

```bash
pnpm build-storybook
npx http-server storybook-static -p 6206 --silent >/dev/null 2>&1 &
node scripts/verify-render.mjs    # FAB / docs 非重複 / ページ文脈の応答
node scripts/check-contrast.mjs   # 両テーマのコントラスト
```

**新しい検証を入れたら、一度わざと壊して赤くなることを確認する。** 緑しか見ていない検証は何も守っていない。実際この 2 本は、緩い判定のせいで本物の不具合を 2 回見逃した。

## 図を SVG にしたいとき

GitHub と Zenn は mermaid をネイティブ描画するので、Markdown ではそのまま書けばよい。
Storybook の story に埋める等で SVG が要る場合は
[Pretty-mermaid-skills](https://github.com/imxv/Pretty-mermaid-skills) が使える。

```bash
node scripts/render.mjs -i diagram.mmd -o diagram.svg --accent "#0057B8" --transparent
```

**構文の対応範囲は本家より狭い。** `<br/>` による改行と引用符付きラベルは
解釈されず、そのまま文字として出る（実測）。SVG が要る図は改行を使わない
書き方にするか、本家 mermaid でレンダリングしたものを使う。
