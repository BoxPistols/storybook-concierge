# Storybook 本体への提案計画

## 前提の確認（2026-08 時点で実測）

npm を検索した範囲では、**「Storybook を見ている人がその場で質問できる」アドオンは存在しない**。

近いものは `@storybook/addon-mcp`（0.7.0）だが、これは _エージェントが Story を書く／テストする_ ための入口で、向きが逆。競合しない。

|            | `@storybook/addon-mcp`（公式） | Concierge                      |
| ---------- | ------------------------------ | ------------------------------ |
| 利用者     | コーディングエージェント       | Storybook を見ている人         |
| 動く場所   | エディタ / CLI 側              | Storybook の画面の中           |
| 知識の向き | Storybook を**読み出す**       | Storybook に**知識を持ち込む** |
| 必要なもの | MCP 対応エージェント           | ブラウザだけ                   |

デザインシステムの利用者は開発者だけではない。デザイナー・ディレクターが「これ何？」と聞ける入口は、公式には無い。

## 現実的な道筋

**Storybook 本体（core）が機能アドオンを取り込むことは稀。** 最初から core を狙わず、公式カタログに載る community addon として実績を作り、そのうえで提案する。

### Phase 1 — ヘッドレス化（必須の前提）

**これが済むまで先に進めない。** 現状 UI 層は MUI v7 に依存している（実測: 全体 6,398 行のうち 1,857 行 / 8 ファイル / 29%）。Storybook 利用者の UI 基盤は多様で、チャット 1 つのために MUI を強制するアドオンは採用されない。

- ロジック層 4,541 行（AI 呼び出し・Embedding・FAQ 検索・状態管理）を `useConcierge()` として切り出す
- UI は利用側に委ねる。MUI 版・素の CSS 版を参考実装として同梱
- 判断基準: **素の React + CSS だけで動く版が存在すること**

### Phase 2 — アドオンとして npm 公開

`storybook-addon-concierge` として公開する。addon の作法に合わせる:

- `preview.ts` で Decorator を自動登録（利用者が preview を書き換えなくてよい）
- `manager.ts` でツールバーに開閉ボタン（FAB を出さない選択肢）
- `parameters.concierge` で story ごとに制御
- Storybook の公式テンプレート（`@storybook/addon-kit`）に沿う

**同時に満たすもの**

- Storybook 10 / 9 の両対応（利用者の版は割れる）
- React 以外の renderer での挙動を明記（現状 React 専用）
- キーを配らない設計の説明（バックエンドプロキシ + レート制限）を README の冒頭に

### Phase 3 — 公式カタログ登録

`storybook-addon` タグを付けて公開すると [Storybook Addon Catalog](https://storybook.js.org/addons) に載る。ここまでは提案不要で自力で到達できる。

### Phase 4 — 提案

**採用の材料が揃ってから**出す。材料とは:

- カタログでの実利用（週次 DL、GitHub の issue/PR）
- 「開発者以外が Storybook を使う」需要の裏付け（利用者の声）
- core に入れる場合の設計案（依存を増やさない形）

出し先は [storybook#discussions](https://github.com/storybookjs/storybook/discussions) の Ideas。いきなり PR を投げない。**まず「この用途に需要はあるか」を問う形にする。**

## 現時点でやらないこと

- Storybook 本体へのいきなりの PR
- core への取り込みを前提にした設計
- 「AI チャット」を売りにした押し出し。**売りは「デザインシステムの知識が、見ている場所に居る」こと**で、AI はその手段でしかない

## 次の一手

Phase 1（ヘッドレス化）。境界は既に 1 パッケージ・29% に収まっているので、着手できる状態にある。
