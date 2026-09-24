#!/usr/bin/env node
// FAQ選択の正しさを測る。既存の findFaqAnswer と、型付き判定（Jevのchoice）を同じ質問で比べる。
//
//   TYPESAFE_API_KEY=... npx tsx tools/measure-faq-pick.mts
//
// 質問は筆者が書いたもので、FAQのキーワードをそのまま含まない言い換えが20件、
// どのFAQでも答えられないものが10件。数値の読み方は docs/faq-pick-ai.md にある。
// 導入先のFAQで測り直すときは、下の QUESTIONS を自分のものに差し替える。

import { FAQ_DATABASE, findFaqAnswer } from '../src/ChatSupport/faqDatabase'
import { buildFaqCriteria, toFaqPick } from '../src/ChatSupport/faqPick'

const QUESTIONS = [
  {
    "q": "チャットの窓はどこから出せますか",
    "expect": 0
  },
  {
    "q": "この相談窓口で何ができるのか教えて",
    "expect": 0
  },
  {
    "q": "OpenAIの鍵はどこに書けばいいですか",
    "expect": 1
  },
  {
    "q": "認証情報を環境変数で渡したい",
    "expect": 1
  },
  {
    "q": "GeminiとGPTを切り替えたい",
    "expect": 2
  },
  {
    "q": "どの言語モデルを使うか選べますか",
    "expect": 2
  },
  {
    "q": "送信はEnterですか、それともCmd+Enterですか",
    "expect": 3
  },
  {
    "q": "キー操作の一覧が知りたい",
    "expect": 3
  },
  {
    "q": "左の一覧から表示を切り替える方法",
    "expect": 4
  },
  {
    "q": "Canvasとdocsの違いは何ですか",
    "expect": 4
  },
  {
    "q": "propsの値を画面上で変えて試したい",
    "expect": 5
  },
  {
    "q": "ノブでargsをいじる場所はどこ",
    "expect": 5
  },
  {
    "q": "鍵を用意しなくても回答は出ますか",
    "expect": 6
  },
  {
    "q": "ネットにつながらない状態でも使えますか",
    "expect": 6
  },
  {
    "q": "自動生成のドキュメントページを出したい",
    "expect": 7
  },
  {
    "q": "tagsに何を書くとDocsが付きますか",
    "expect": 7
  },
  {
    "q": "テーマの主色はどこで定義されていますか",
    "expect": 8
  },
  {
    "q": "配色の一覧を確認したい",
    "expect": 8
  },
  {
    "q": "開発サーバーの立ち上げ方を教えて",
    "expect": 9
  },
  {
    "q": "このリポジトリのディレクトリ構成は",
    "expect": 9
  },
  {
    "q": "今日の東京の天気を教えて",
    "expect": null
  },
  {
    "q": "この会社の採用条件は何ですか",
    "expect": null
  },
  {
    "q": "TypeScriptの型パズルを解いてほしい",
    "expect": null
  },
  {
    "q": "請求書の宛名を変更したい",
    "expect": null
  },
  {
    "q": "配送状況を確認したい",
    "expect": null
  },
  {
    "q": "パスワードを忘れました",
    "expect": null
  },
  {
    "q": "昼食のおすすめはありますか",
    "expect": null
  },
  {
    "q": "データベースの移行手順を教えて",
    "expect": null
  },
  {
    "q": "契約の解約方法を知りたい",
    "expect": null
  },
  {
    "q": "税金の申告期限はいつですか",
    "expect": null
  }
]

const apiKey = process.env.TYPESAFE_API_KEY
if (!apiKey) {
  console.error('TYPESAFE_API_KEY が要ります')
  process.exit(2)
}

const faqs = FAQ_DATABASE.map((f) => ({ title: f.title, keywords: f.keywords }))
const baseline = QUESTIONS.map(({ q, expect }) => {
  const answer = findFaqAnswer(q)
  const got = answer === null ? null : FAQ_DATABASE.findIndex((f) => f.answer === answer)
  return { q, expect, got }
})

const questions = {
  faq: { type: 'choice', instructions: 'この質問に答えられるFAQ', criteria: buildFaqCriteria(faqs) },
}

const jev = []
let tokens = 0
for (const { q, expect } of QUESTIONS) {
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: { 利用者の質問: q }, model: 'jev-latest', questions }),
  })
  if (!res.ok) {
    console.error(`APIが ${res.status} を返しました`)
    process.exit(1)
  }
  const json = await res.json()
  tokens += json.usage?.input_tokens ?? 0
  const picked = toFaqPick(json.answers?.faq, faqs.length)
  jev.push({ q, expect, got: picked.index, confidence: picked.confidence })
}

const score = (rows) => ({
  hit: rows.filter((r) => r.expect !== null && r.got === r.expect).length,
  wrongOnNone: rows.filter((r) => r.expect === null && r.got !== null).length,
})
const withFaq = QUESTIONS.filter((q) => q.expect !== null).length
const b = score(baseline)
const j = score(jev)
console.log(`FAQ ${faqs.length}件 / 質問 ${QUESTIONS.length}件（FAQに当たるもの ${withFaq}件）\n`)
console.log('                     正解        FAQに無い質問に誤答')
console.log(`findFaqAnswer        ${b.hit}/${withFaq}        ${b.wrongOnNone}`)
console.log(`Jevのchoice          ${j.hit}/${withFaq}        ${j.wrongOnNone}`)
console.log(`\n入力${tokens.toLocaleString()}トークン  約$${((tokens / 1e6) * 0.042).toFixed(4)}`)
for (const r of jev) {
  if (r.got !== r.expect) console.log(`  × 期待${r.expect ?? 'なし'} → ${r.got ?? 'なし'} (conf ${r.confidence})  ${r.q}`)
}
