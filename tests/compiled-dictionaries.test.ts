import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDictionaryRows, readManifest } from '../scripts/data.ts';
import { createHash } from 'node:crypto';
import { DICTIONARY_OPTIONS, dictionaryKey } from '../src/dictionary-settings.ts';
import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildPool, generateWords, decodeWord, joinWords } from '../src/generator.ts';
import {
  createDictionaryLoader,
  parseDictionary,
  selectDictionaryPool,
} from '../src/dictionary-loader.ts';

const original = readDictionaryRows();
const manifest = readManifest();
const text = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), `../public${manifest.url}`),
  'utf8',
);
const dictionary = parseDictionary(text, manifest.count, manifest.settings);

test('reviewed compact dictionary preserves every token, hint and eligibility bit', () => {
  assert.equal(
    createHash('sha256').update(text).digest('hex'),
    '6d0bd72395dbbff28a8136aa379579b9c0325ef6495a3aea5ad3207c0fbc8898',
  );
});

test('every compiled candidate and hint matches the original algorithm in all 8 settings', () => {
  assert.equal(Object.keys(manifest.settings).length, 8);
  assert.equal(
    readdirSync(resolve(dirname(fileURLToPath(import.meta.url)), '../public/dictionaries/')).length,
    1,
  );
  for (const options of DICTIONARY_OPTIONS) {
    const info = manifest.settings[dictionaryKey(options)];
    const expected = buildPool(original, options);
    const compiled = selectDictionaryPool(dictionary, info.mask);
    assert.equal(info.count, expected.length);
    assert.deepEqual(
      compiled,
      expected.map(({ token, hint }) => `${token}\t${hint}`),
    );
    // Identical RNG inputs must produce identical passphrases, including repetitions.
    const fromOld = generateWords(expected, 6, (buffer) => {
      buffer[0] = 123456;
    });
    const fromNew = generateWords(compiled, 6, (buffer) => {
      buffer[0] = 123456;
    }).map(decodeWord);
    assert.equal(joinWords(fromNew), joinWords(fromOld));
    assert.deepEqual(
      fromNew.map((w) => w.hint),
      fromOld.map((w) => w.hint),
    );
  }
});

test('dictionary requests are reused when settings are revisited or requested concurrently', async () => {
  let calls = 0;
  const words = ['tokyo\t東京'];
  const load = createDictionaryLoader(async () => {
    calls++;
    return { ok: true, text: async () => 'tokyo\t東京\t255' };
  });
  const first = load('/default.txt', 1);
  assert.equal(load('/default.txt', 1), first);
  const decoded = await first;
  assert.deepEqual(decoded.words, words);
  assert.deepEqual([...decoded.masks], [255]);
  assert.equal(await load('/default.txt', 1), decoded);
  for (let bit = 0; bit < 8; bit++) {
    assert.deepEqual(selectDictionaryPool(decoded, 1 << bit), words);
    assert.equal(selectDictionaryPool(decoded, 1 << bit), selectDictionaryPool(decoded, 1 << bit));
  }
  assert.equal(calls, 1);
});

test('network, HTTP and decoding failures can be retried without reloading the page', async () => {
  for (const failure of [
    () => {
      throw new Error('Offline');
    },
    () => ({ ok: false }),
    () => ({
      ok: true,
      text: async () => {
        throw new Error('Decoding failed');
      },
    }),
  ]) {
    let calls = 0;
    const load = createDictionaryLoader(async () => {
      if (++calls === 1) return failure();
      return { ok: true, text: async () => 'tokyo\t東京\t255' };
    });
    await assert.rejects(load('/default.txt', 1));
    assert.deepEqual((await load('/default.txt', 1)).words, ['tokyo\t東京']);
    assert.equal(calls, 2);
  }
});

test('truncated dictionaries fail before they can reduce the sampling pool', async () => {
  const load = createDictionaryLoader(async () => ({
    ok: true,
    text: async () => 'tokyo\t東京\t255',
  }));
  await assert.rejects(load('/truncated.txt', 14698), /Incomplete dictionary/);
});

test('invalid eligibility and setting counts fail before sampling', () => {
  for (const mask of ['0', '256', '1.5', 'invalid']) {
    assert.throws(() => parseDictionary(`tokyo\t東京\t${mask}`, 1), /Invalid dictionary entry/);
  }
  assert.throws(
    () =>
      parseDictionary('tokyo\t東京\t1', 1, {
        sample: { mask: 1, count: 2 },
      }),
    /Incomplete dictionary setting/,
  );
});
