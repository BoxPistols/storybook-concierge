---
name: add-storybook-concierge
description: 既存の Storybook に AI チャット「Concierge」を組み込む。依存追加・ファイル配置・設定追記・実ブラウザ検証まで通して、動く状態にして返す
---

# add-storybook-concierge

既存の Storybook に、いま見ている Story の文脈を持った AI チャットを常駐させる。

**知識ベースは書かなくてよい。** Storybook が既に持っているメタ情報（Story の `title` / `name` / `docs.description.component` / 現在の `args`）から、そのプロジェクトのページについて答える。

対象は **`@storybook/react-vite` の Storybook 10 系**。webpack5 / Next.js framework は対象外（`viteFinal` への追記が効かない）。検出したら止める。

## 手順

### 1. インストーラを実行する

導入先のプロジェクト直下で実行する。環境検出・依存追加・ファイル配置をここでやる。

```bash
node <このスキルのパス>/scripts/install.mjs
```

出力に従う。止まった場合は理由が出るので、対応してから再実行する。
`--dry-run` を付けると何も変更せず、やることだけ出す。

### 2. `.storybook/main.*` の `viteFinal` に追記する

install.mjs が貼る内容をそのまま出力する。**`mergeConfig` を使い、既存設定は消さない。**
`viteFinal` が無ければ新設、あればその戻り値にマージする。

### 3. `.storybook/preview.*` に Decorator を追加する

`references/decorator.md` のコードを使う。**既存の decorators 配列に追加**する（置き換えない）。
落とすと事後に気づきにくい 3 点があるので、参照をそのまま読むこと。

### 4. 検証する

**全部通って初めて完了。** ビルドが通ることと実ブラウザで動くことは別物なので、途中で完了報告しない。

```bash
<pm> run build-storybook            # a. ビルドが通る
<pm> run storybook                  # b. dev も起動する（別経路。ここだけ落ちる事故が実在する）
```

c〜e は自動化してある。`scripts/verify-render.mjs` を導入先にコピーして実行する。

```bash
npx http-server storybook-static -p 6206 --silent >/dev/null 2>&1 &
node scripts/verify-render.mjs
```

|     | 見るもの                                                                         |
| --- | -------------------------------------------------------------------------------- |
| c   | 全 Story で FAB がちょうど 1 つ                                                  |
| d   | Docs ページで FAB が重複しない                                                   |
| e   | キー未設定で「この画面なに？」がページ文脈の応答を返す                           |
| f   | バンドルに API キーの実値が無い（`.env` に実値があるならその文字列で `grep -R`） |

落ちたら `references/troubleshooting.md` を見る。

## 完了報告に含めること

- 変更・追加したファイル一覧
- 検証 a〜f の**個別の結果**（コマンドと観測値。「確認した」ではなく実測を書く）
- MUI を新規に入れた場合はその旨

## 事前に伝えること

**UI は MUI v7 の基本部品 27 種で書かれている。** 導入先に MUI が無ければ install.mjs が `@mui/material` + `@emotion` を追加する。Tailwind などで統一されているプロジェクトでは、チャット 1 つのために UI ライブラリが増える。install.mjs は警告を出したうえで進めるので、**実行前に利用者へこの事実を伝える。**

ロジック層（AI 呼び出し・Embedding・FAQ 検索・状態管理、全体の 71%）は UI ライブラリ非依存。ヘッドレス化は今後の課題。

## 参照

| ファイル                        | いつ読むか                             |
| ------------------------------- | -------------------------------------- |
| `references/decorator.md`       | 手順 3 で必ず                          |
| `references/troubleshooting.md` | 検証が落ちたとき                       |
| `references/customize.md`       | 知識ベースを育てたくなったとき（任意） |
