import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { buildPool } from '../src/generator.mjs';

const rows = JSON.parse(readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));
const provenance = JSON.parse(readFileSync(new URL('../src/data/addition-provenance.json', import.meta.url), 'utf8'));
const additions = rows.filter(row => row[0].startsWith('ja:ADD_'));

test('all approved additions retain their source and reviewed long-vowel spelling', () => {
  assert.equal(additions.length, 3735);
  assert.equal(rows.length, 19221);
  assert.equal(Object.keys(provenance.entries).length, additions.length);
  for (const row of additions) {
    const entry = provenance.entries[row[0]];
    assert(entry && provenance.sources[entry.source], row[0]);
    assert.equal(row[1], entry.kana_token);
    assert.equal(row[2], entry.short_token);
    assert(Number.isInteger(entry.source_row) && entry.source_row > 0);
    assert.equal(row[3], 0);
    assert(row[4] && row[5] && /^[a-z]+$/.test(row[1]) && /^[a-z]+$/.test(row[2]));
  }
  assert.equal(additions.filter(row => provenance.entries[row[0]].long_vowel_review).length, 601);
  for (const token of ['arasou', 'omou', 'osou', 'sasou', 'tsukisou', 'mayou', 'nuu', 'kuruu']) {
    assert.equal(additions.find(row => row[1] === token)?.[2], token, token);
  }
});

test('all eight downloads match the sampling pool and carry row-specific source conditions', () => {
  for (const english of [false, true]) for (const long of [false, true]) for (const romanization of ['kana', 'short']) {
    const pool = buildPool(rows, { english, long, romanization });
    const zip = unzipSync(readFileSync(new URL(`../public/wordlists/words-${Number(english)}-${Number(long)}-${romanization}.zip`, import.meta.url)));
    for (const filename of ['NOTICE.txt', 'ADDITIONS-NOTICE.txt', 'SUDACHI-NOTICE.txt', 'CC-BY-SA-4.0.txt', 'Apache-2.0.txt', 'JUMAN-BSD.txt', 'CC0-NOTICE.txt']) {
      assert(zip[filename]?.length > 100, filename);
    }
    const lines = strFromU8(zip['words.csv']).replace(/^\ufeff/, '').trimEnd().split('\r\n');
    assert.equal(lines.length, pool.length + 1);
    for (const [index, word] of pool.entries()) {
      const columns = [...lines[index + 1].matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)]
        .map(match => match[1].replaceAll('""', '"'));
      assert.equal(columns.length, 9);
      assert.equal(columns[0], word.token);
      assert.equal(columns[1], word.hint);
      if (word.id.startsWith('ja:ADD_')) {
        const entry = provenance.entries[word.id];
        const source = provenance.sources[entry.source];
        assert.equal(columns[5], source.name);
        assert.equal(columns[6], source.license);
        assert.equal(columns[7], source.url);
        assert.equal(columns[8], `${entry.source_file}:${entry.source_row}`);
        assert.notEqual(columns[6], 'CC0-1.0');
      }
    }
  }
});
