import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { zipSync, strToU8 } from 'fflate';
import { buildPool } from '../src/generator.ts';
import { DICTIONARY_OPTIONS, dictionaryKey } from '../src/dictionary-settings.ts';
import { readDictionaryRows, readProvenance } from './data.ts';

const dictionary = readDictionaryRows();
const additions = readProvenance();
const outputDirectory = new URL('../public/wordlists/', import.meta.url);
const licenseDirectory = new URL('../public/licenses/', import.meta.url);
const licenses = Object.fromEntries(
  readdirSync(licenseDirectory)
    .filter((name) => name.endsWith('.txt'))
    .map((name) => [name, readFileSync(new URL(name, licenseDirectory))]),
);

mkdirSync(outputDirectory, { recursive: true });

for (const options of DICTIONARY_OPTIONS) {
  const { english, long, romanization } = options;
  const pool = buildPool(dictionary, { english, long, romanization });
  const rows = [
    ['英字表記', '補助表示', '読み', '意味', '言語', '出典', 'ライセンス', '出典URL', '出典箇所'],
    ...pool.map((word) => {
      let source = 'tsuchm/diceware-ja';
      let license = 'BSD-3-Clause';
      let url = 'https://github.com/tsuchm/diceware-ja';
      let reference = '';
      if (word.id.startsWith('ja:JX')) source = 'JUMAN 7.0';
      if (word.id.startsWith('ja:ADD_')) {
        const entry = additions.entries[word.id];
        const info = entry && additions.sources[entry.source];
        if (!entry || !info) throw new Error(`Missing source attribution: ${word.id}`);
        source = info.name;
        license = info.license;
        url = info.url;
        reference = `${entry.source_file}:${entry.source_row}`;
      }
      if (word.language === 'en') {
        const independent = word.id.startsWith('en:ENX');
        source = independent ? '独自追加語' : 'NGSL 1.2';
        license = independent ? 'CC0-1.0' : 'CC-BY-SA-4.0';
        url = independent
          ? 'https://creativecommons.org/publicdomain/zero/1.0/'
          : 'https://www.newgeneralservicelist.com/new-general-service-list';
      }
      return [
        word.token,
        word.hint,
        word.reading,
        word.meaning,
        word.language,
        source,
        license,
        url,
        reference,
      ];
    }),
  ];
  const csv =
    '\ufeff' +
    rows
      .map((row) => row.map((value) => '"' + value.replaceAll('"', '""') + '"').join(','))
      .join('\r\n') +
    '\r\n';
  const notice = `日本語パスフレーズジェネレーター 単語リスト

候補数: ${pool.length}
英単語を含める: ${english ? 'はい' : 'いいえ'}
長い単語を含める: ${long ? 'はい' : 'いいえ'}
長音を短くする: ${romanization === 'short' ? 'はい' : 'いいえ'}
生成時と同じ条件で選別し、同じ英字表記は1件にまとめています。
words.csv は UTF-8（BOM付き）です。

日本語: tsuchm/diceware-ja（Juman BSDライセンスに準拠）
https://github.com/tsuchm/diceware-ja
日本語追加: JUMAN 7.0 / Copyright (c) 2012 Kyoto University
ライセンス全文: JUMAN-BSD.txt

日本語追加（2026-11-04）: 国立国語研究所の教育基本語彙・日本語教育基本語彙、
幼児・絵本・作文・教科書・漢字語彙（CC BY 4.0）、JMnedict / EDRDG（CC BY-SA 4.0）、
SudachiDict（Apache 2.0、UniDic・NEologdの著作権表示も同梱）。
資料名・リンク・変更点・適用条件: ADDITIONS-NOTICE.txt / SUDACHI-NOTICE.txt
新規日本語の出典条件はCC0に置き換えていません。

英語: New General Service List by Browne, C., Culligan, B., and Phillips, J.
https://www.newgeneralservicelist.com/new-general-service-list
NGSL由来の英語とその改変部分: CC BY-SA 4.0
https://creativecommons.org/licenses/by-sa/4.0/
ライセンス全文: CC-BY-SA-4.0.txt

上流と独立した独自追加英語・読み・意味: CC0 1.0 Universal
CSVの「出典」が「独自追加語」の行が対象です。
https://creativecommons.org/publicdomain/zero/1.0/
CC0宣言と正式な法的文書へのリンク: CC0-NOTICE.txt

CSVの「ライセンス」列で、行ごとの適用条件を確認できます。

変更点: 単語の選別、読み・意味の補助、長音短縮、同じ表記の重複整理。
`;
  const archive = zipSync(
    {
      'words.csv': strToU8(csv),
      'NOTICE.txt': strToU8('\ufeff' + notice),
      ...licenses,
    },
    { level: 6 },
  );
  const filename = `words-${dictionaryKey(options)}.zip`;
  writeFileSync(new URL(filename, outputDirectory), archive);
}

console.log('Built word-list downloads for all 8 dictionary settings.');
