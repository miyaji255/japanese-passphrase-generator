import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { resolveLength, MAX_WORD_COUNT } from '../src/length-settings.ts';
import { DICTIONARY_OPTIONS, dictionaryKey } from '../src/dictionary-settings.ts';
import { readManifest } from '../scripts/data.ts';

test('word and entropy sliders agree for all dictionary settings without rounding up entropy', () => {
  const manifest = readManifest();
  for (const options of DICTIONARY_OPTIONS) {
    const size = manifest.settings[dictionaryKey(options)].count;
    for (const count of [1, 5, 6, MAX_WORD_COUNT]) {
      const selected = resolveLength({ mode: 'words', value: count }, size);
      assert.equal(selected.count, count);
      assert.equal(selected.minimumBits, Math.floor(selected.bits));
    }
    for (const target of [1, 50, 80, 100]) {
      const selected = resolveLength({ mode: 'entropy', value: target }, size);
      assert(selected.bits >= target);
      assert((selected.count - 1) * Math.log2(size) < target);
      assert.equal(selected.minimumBits, target);
    }
    const clamped = resolveLength({ mode: 'entropy', value: 1000 }, size);
    assert.equal(clamped.count, MAX_WORD_COUNT);
    assert.equal(clamped.minimumBits, clamped.maximumBits);
  }
});
