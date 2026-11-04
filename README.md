# 日本語パスフレーズジェネレーター

![CI](https://github.com/miyaji255/japanese-passphrase-generator/actions/workflows/pages.yml/badge.svg)

日本人向けパスフレーズジェネレーター。Astro・TypeScript・SolidJSによる静的なクライアントアプリです。チェックとテストにはVite+を使います。バックエンド、DB、外部API、解析SDK、生成結果の永続化は使いません。

公開先: https://miyaji255.github.io/japanese-passphrase-generator/

## 機能

- 語数は1〜20語のスライダー。初期値6語。
- 最低エントロピーのスライダーは1bitから、現在の候補で20語が到達する整数bit数まで。最低bit数を変えると達成に必要な最小語数を選び、語数を変えると到達する整数bit数を表示。判定には丸める前の値を使います。
- 英語・長い語は初期値ON。
- 長音の表記はかな方式／短い方式。短い方式が初期値。
- ローマ字の下には、漢字・かなによる単語の補助表示を1段だけ表示。
- 区切りはハイフン固定。コピー対象は実際のパスフレーズだけ。
- Web Cryptoの乱数を棄却法で整数化し、偏りなく独立抽選。繰り返しを許可。
- 表記方式・言語・長い語を適用してから重複整理。補助の意味の数はエントロピーに数えません。
- 設定変更時に再生成。履歴・設定・生成結果は保存しません。
- フッターから現在の辞書設定に対応する単語リストをダウンロード。ZIPにUTF-8 BOM付きCSV、設定と出典、ライセンス全文・CC0宣言を同梱。
- CSVのライセンス列で適用条件を明示。既存日本語はBSD、追加日本語は出典に応じCC BY 4.0 / CC BY-SA 4.0 / Apache 2.0と上流の著作権表示、NGSL由来の英語とその改変部分はCC BY-SA 4.0、独立した追加英語とその読み・意味はCC0。

## データ

`src/data/words.json`は採用済み19,221エントリーのコンパクト表現です。各行は `[id, kana_token, short_token, language(0=ja), hint, reading, meaning, mora, familiarity]`。

2026-11-04に、国立国語研究所の基本語彙・児童語彙群、SudachiDict、JMnedictから選定した3,735語を追加しました。長さを理由に除外せず、601語の長音短縮形は作成担当と別担当の評価を記録しています。不確かな短縮は元のかな準拠表記を維持しています。`src/data/addition-provenance.json`に出典ファイル・行、表記、評価を保持します。このメタデータはビルド時のダウンロード作成に使い、ブラウザー用辞書には含めません。

| 表記方式 | 英語あり・長い語なし | 英語あり・長い語あり |
| -------- | -------------------: | -------------------: |
| かな方式 |               16,542 |               19,171 |
| 短い方式 |               15,815 |               18,316 |

日本語のみの候補数は、かな方式で長い語なし13,945・あり16,574、短い方式で長い語なし13,230・あり15,731です。出力される英字表記で重複を除いており、追加したレコード数とは一致しません。初期設定は18,316候補で、5語は約70.8bit、6語は約85.0bitです。

箕面の短縮形はユーザー指定の`mino`。出典と変更点はページ下部に表示し、ライセンス全文は`public/licenses/`に収録しています。

## 開発

Node.js 24（`.node-version`）、pnpm 11.25.0を使用します。Node.jsの対応範囲は`package.json`の`engines`に記載しています。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm check
pnpm test
pnpm build
pnpm check:build
```

`pnpm check`でOxfmtの整形チェック、Oxlintの型付きlint、TypeScriptの厳密な型チェックと`astro check`によるAstroファイルの型チェックを行います。`pnpm format`で整形、`pnpm lint`でlintを単独実行できます。Oxfmtは`@astrojs/compiler-rs`を使い、`.astro`も整形します。Vite+はプロジェクトの依存関係として固定しているため、グローバルの`vp`は必須ではありません。

開発・ビルド・プレビューはそれぞれ`astro dev`・`astro build`・`astro preview`で行います。辞書の準備も含む`pnpm dev`・`pnpm build`を使ってください。グローバルVite+を使う場合は`vp run dev`・`vp run build`でこれらのスクリプトを起動できます。

`dist/`が公開用の静的ファイルです。生成用辞書とダウンロードZIPは毎回ビルド時に作成し、Gitには含めません。

GitHub Pagesと同じサブパスで確認する場合は、ビルド・検証の両方に`BASE_PATH`を指定します。

```sh
BASE_PATH=/japanese-passphrase-generator/ pnpm build
BASE_PATH=/japanese-passphrase-generator/ pnpm check:build
```

意味のあるテストとして、全8設定の候補数と重複整理、候補に応じた記憶補助、棄却法の境界、最低bit数の切り上げ、繰り返しとコピー文字列を検証しています。

追加語は全件の出典・短縮形と、全8設定のダウンロードCSVが抽選候補に一致すること、出典に応じたライセンス・NOTICEが同梱されることも検証しています。

Vitestで実行し、happy-domによるスライダー連動・設定変更・コピー・コピー失敗の画面テストも含めています。辞書の英字表記・補助表示・設定フラグが変わっていないことは、コンパクト辞書全体のハッシュでも検証します。語彙を変更する際は、候補数・ハッシュの期待値を変更内容と照合してください。元の大容量辞書JSONは整形対象から除外しています。

## 構成

- `src/components/`: 結果表示、生成設定、出典などの表示部品。
- `src/pages/index.astro`: HTML・head・CSSと辞書の先読みを定義するAstroページ。`App`を`client:load`で読み込みます。
- `src/hooks/`: 辞書の読み込みと生成、クリップボード、幅調整。
- `src/generator.ts`・`src/length-settings.ts`: 抽選、エントロピー、語数の計算。
- `src/types.ts`・`src/dictionary-settings.ts`: 辞書と全8設定の共通定義。
- `scripts/`: TypeScriptによる辞書・ZIP作成と公開ファイル検証。

サイトの設定は`astro.config.ts`、lint・format・テストの設定は`vite.config.ts`、型チェックの設定は`tsconfig.json`にまとめています。静的HTML生成・Solidのhydration・CSSのインライン化はAstroと公式の`@astrojs/solid-js`に任せています。パスフレーズ生成はブラウザーで行い、ビルド済みHTMLに生成結果を含めません。

## CI・公開

`.github/workflows/pages.yml`で以下を実行します。

- PR: ロックファイルに従ったインストール、format・lint・型チェック、テスト、ビルド、公開ファイルとサブパスの検証。
- mainへのpush・手動実行: 同じ検証に成功した成果物をGitHub Pagesへ公開。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定します。独自のトークンやシークレットは不要です。ActionsをコミットSHAで固定し、デプロイジョブだけにPages公開とOIDCの権限を付けています。

ビルド時の`PUBLIC_COMMIT_SHA`を使い、サイト下部の「GitHub」はリポジトリのトップへ、「この版のソース」は実際に公開されたコミットへリンクします。辞書は内容のハッシュ付きファイル名で1ファイルにまとめ、HTMLから先読みします。

## ライセンス

アプリのコードは[MIT](LICENSE)です。辞書データには出典ごとの条件が適用され、MITへの変更は行っていません。

| 対象                                             | ライセンス・表示                                 |
| ------------------------------------------------ | ------------------------------------------------ |
| diceware-ja / JUMAN由来の既存日本語              | BSD、[著作権表示](public/licenses/JUMAN-BSD.txt) |
| 国立国語研究所の追加語彙                         | CC BY 4.0                                        |
| JMnedict由来の追加語彙、NGSL由来の英語と改変部分 | CC BY-SA 4.0                                     |
| SudachiDict由来の追加語彙                        | Apache 2.0と、UniDic・NEologdの上流著作権表示    |
| 上流資料と独立した追加英語・読み・意味           | CC0                                              |

詳細は[日本語追加語の出典](public/licenses/ADDITIONS-NOTICE.txt)、[SudachiDictのNOTICE](public/licenses/SUDACHI-NOTICE.txt)、[CC0の対象](public/licenses/CC0-NOTICE.txt)、[ライセンス一覧](public/licenses/)を参照してください。ダウンロードZIPにも出典・利用条件を同梱します。
