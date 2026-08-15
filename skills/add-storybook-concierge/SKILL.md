---
name: add-storybook-concierge
description: 既存の React + Vite 系 Storybook に AI チャットウィジェット「Concierge」を組み込み、検証ゲートまで通す
---

# add-storybook-concierge

既存の **React + Vite 系 Storybook**（`@storybook/react-vite`）に、storybook-concierge の
ChatSupport（Concierge）を組み込む手順。最後の「検証ゲート」を **6 つ全部**通して初めて完了とする。
ビルドが通ることと実ブラウザで動くことは別物なので、途中で完了報告しない。

## 0. 前提確認（作業前に必ず）

1. **Storybook 10 + react-vite か**
   対象プロジェクトの `package.json` を読み、`storybook` が `^10` 系で、
   `@storybook/react-vite` が devDependencies にあることを確認する。
   `@storybook/react-webpack5` / Next.js framework の場合はこの手順の対象外
   （viteFinal への追記が効かない）。その旨を報告して止める。
2. **パッケージマネージャ判別**
   lockfile で判別する: `pnpm-lock.yaml` → pnpm / `yarn.lock` → yarn / `package-lock.json` → npm。
   以降のコマンドは判別した PM に読み替える。
3. **親ディレクトリの package.json 誤認チェック**
   npm / npx は上位ディレクトリに `package.json` があるとそこをルートと誤認する。
   `ls package.json` で **カレントディレクトリ直下**に存在することを確認し、
   `npm prefix` がカレントを指すことも見る。scratchpad 等の一時ディレクトリに
   `package.json` / `node_modules` を残していると後の検証が汚染される。

## 1. 依存追加

storybook-concierge の `package.json` に合わせる（正確なバージョンはそちらを一次ソースにする）。
対象プロジェクトに既にあるもの（react / @mui/material 等）は重複追加しない。

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/google \
  react-markdown remark-gfm prism-react-renderer fuse.js lucide-react \
  @mui/material @mui/icons-material @emotion/react @emotion/styled
```

## 2. ファイル取得とコピー

**ローカル clone があればそれを優先**する（`/Users/…/storybook-concierge` 等、このスキルが入っているリポジトリ自身）。

```bash
cp -R <storybook-concierge>/src/ChatSupport <target>/src/ChatSupport
mkdir -p <target>/lib && cp <storybook-concierge>/lib/maxOutputTokens.ts <target>/lib/
```

ローカル clone が無ければ GitHub から取る（**リポジトリ public 化後に有効**。private の間は 404 になるのでローカル clone を使う）:

```bash
npx degit BoxPistols/storybook-concierge/src/ChatSupport src/ChatSupport
npx degit BoxPistols/storybook-concierge/lib lib-tmp && cp lib-tmp/maxOutputTokens.ts lib/ && rm -rf lib-tmp
```

コピー後、import パスを確認する:

- ChatSupport 内から `../../lib/maxOutputTokens` への相対 import → `lib/` をリポジトリルートに置いていれば解決する。階層が違うなら import を直す
- `@/theme/...` 形式の import が残っていたら、対象プロジェクトの `@` エイリアス（tsconfig `paths` と vite `resolve.alias` の両方）を確認し、無ければ張るか、対象プロジェクトのテーマ import に書き換える

## 3. .storybook/main への追記（丸ごと置換禁止）

**対象プロジェクトの main.ts / main.cjs を丸ごと置き換えてはいけない。** 既存の stories glob /
addons / framework 設定はそのプロジェクトの資産なので、`viteFinal` に **`mergeConfig` で**以下を追記する。
既に `viteFinal` がある場合はその戻り値にマージする。

```js
const { mergeConfig } = require('vite')
const { fileURLToPath } = require('node:url')

// pnpm + Storybook 10 + MDX: addon-docs が file:// 絶対 URL の import を emit し
// dev サーバーの vite:import-analysis が解決できず死ぬことへの対処
const fileUrlResolvePlugin = {
  name: 'concierge:resolve-file-url',
  enforce: 'pre',
  resolveId(source) {
    if (typeof source === 'string' && source.startsWith('file://')) {
      return fileURLToPath(source)
    }
    return null
  },
}

// viteFinal 内:
return mergeConfig(config, {
  plugins: [fileUrlResolvePlugin],
  // 本番ビルド用: esbuild target を上げて destructuring の強制降格を回避
  build: { target: 'esnext' },
  // dev サーバー用: build.target は dev の依存事前バンドルに効かない。
  // これが無いと @ai-sdk/gateway (ai 6.x の依存) の destructuring が降格対象になり
  // `storybook dev` が大量のエラーで起動しない。build と dev は別経路。
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { destructuring: true },
    },
  },
})
```

キーを define で注入する場合は、storybook-concierge の `.storybook/main.cjs` を参照して
**`configType === 'PRODUCTION'` のとき空文字に落とす**分岐ごと持ってくる（共有ビルドへの焼き込み防止）。

## 4. preview の Decorator 配線

`.storybook/preview.tsx` に Decorator を足す。storybook-concierge の `.storybook/preview.tsx` が
原本。**次の 3 点を落とさない**（どれを落としても「一見動く」ので事後に気づきにくい）:

1. **useRef パターン**: `context.args` / `context.argTypes` は Controls 操作のたびに新参照になる。
   `useRef` に保持して毎レンダーで `current` を更新し、`useMemo` の依存配列には
   title / name / description だけを入れる。args を依存配列に入れると Controls 操作のたびに
   ChatSupport 側のメモ化が全部無効になる
2. **`context.viewMode !== 'docs'` ガード**: Docs ページは 1 ページに複数 story が並び、
   各 story に Decorator が適用されるため、ガードが無いと FAB が重複描画される
3. **オプトアウト**: `context.parameters?.disableDecoratorChat === true` のとき注入しない。
   ChatSupport 自身を story にする場合の二重レンダリング（position: fixed の同座標に 2 インスタンス、
   state / localStorage 競合）を防ぐ

既存の decorators 配列・parameters は保持し、Decorator を**追加**する（ここも丸ごと置換しない）。

## 5. storyGuideMap を対象プロジェクトに合わせる

`src/ChatSupport/storyGuideMap.ts` の `STORY_GUIDE_MAP` はデモ用の内容なので、
**対象プロジェクトの story 階層に合わせて書き直す**。

- キーは story meta の `title`（例: `"Components/Button"`）。完全一致 → 前方一致の順で解決される
- 各エントリは `summary` / `codeContext[]`（実ファイルパス・実際の値を書く）/ `references?` / `related?`
- 全 story を網羅する必要はない。主要ページから書き、ヒットしない title は FAQ 一般応答に落ちるだけ
- `faqDatabase.ts` の FAQ 内容も対象プロジェクト向けに見直す（デモの内容のままだと嘘を答える）

## 6. 検証ゲート（全部通して完了。1 つでも欠けたら未完了）

| #   | ゲート                                                                              | 落ちたときに疑う場所                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | `build-storybook` が通る                                                            | import パス（`@` エイリアス / `lib/maxOutputTokens` への相対）と手順 1 の依存の入れ忘れ                                                                                             |
| b   | **`storybook dev` も起動する**（build と dev は別経路。dev だけ死ぬ事故が実在する） | 手順 3 の `optimizeDeps.esbuildOptions`（esnext + destructuring）の追記漏れ / file:// resolve プラグイン。設定変更後は `rm -rf node_modules/.vite` してから再起動                   |
| c   | 実ブラウザで任意の story を開き、右下に FAB が描画される                            | Decorator が `decorators` 配列に入っていない / 既存 Decorator との合成時に Story の描画だけ残して注入部を落としている                                                               |
| d   | docs ページ（Docs タブ）で FAB が**重複しない**                                     | `context.viewMode !== 'docs'` ガードの漏れ（手順 4-2）                                                                                                                              |
| e   | API キー未設定のまま質問して **FAQ 応答が返る**                                     | `VITE_API_BASE` が設定されている / 本番ビルドを見ていると Backend Mode になり `/api/ai` へ fetch して失敗する（dev + キー無しで確認する）。faqDatabase / storyGuideMap のコピー漏れ |
| f   | `grep` で API キー実値がバンドルに無い                                              | `.env` にある実値そのもので `grep -R "<実値>" storybook-static/` → **0 件**を確認。ヒットしたら main の define が PRODUCTION で空になっていない（手順 3 末尾）                      |

### 自動化されている

c / d / e は storybook-concierge の `scripts/verify-render.mjs` がそのまま使える。
対象プロジェクトにコピーし、Storybook を配信した状態で実行する。

```bash
pnpm build-storybook
npx http-server storybook-static -p 6206 --silent >/dev/null 2>&1 &
node scripts/verify-render.mjs          # VERIFY_URL で配信先を変更可
```

このスクリプトを書くときに 2 回踏んだ罠があり、対策済み:

- **MUI の multiline TextField は採寸用の隠し textarea を併置する**（`aria-hidden` + `readonly` +
  height 0）。素朴に `textarea` を掴むと `fill` が永久に待つ。
  `textarea:not([aria-hidden="true"]):not([readonly])` で絞る
- **応答判定を本文の文字列一致でやらない。** ページ全体を読むと story 側の文言を拾う
  （Alert の story に含まれる「エラー」を回答失敗と誤判定した）。
  `data-testid="concierge-messages"` の中だけを見て、**送信前後で増えたか**で判定する

### 手で確認する場合

- c / d はスクリーンショットではなく実ブラウザ（Playwright 可）で確認する。CI 緑や build 成功は
  c〜e の根拠にならない
- **検証を入れたら一度わざと壊して赤くなることを確認する。** 例: `viewMode !== 'docs'` を外して
  ビルドし直し、d が「docs の FAB 重複: 3 個」で落ちること。緑しか見ていない検証は
  何も守っていない
- e の質問例: 「この画面は何？」（storyGuideMap のページ文脈応答）と、FAQ にあるトピックの質問を 1 つずつ
- f はキーを 1 度も `.env` に書いていないなら「`VITE_OPENAI_API_KEY` という変数名で値が空になっていること」を
  `storybook-static/` の grep で確認する

## 完了報告に含めること

- 変更・追加したファイル一覧
- 検証ゲート a〜f の個別の結果（コマンドと観測。「確認した」ではなく実測値を書く）
- storyGuideMap / faqDatabase をどこまで対象プロジェクト向けに書き換えたか（残タスクがあれば明記）
