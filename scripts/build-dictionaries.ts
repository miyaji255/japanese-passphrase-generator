import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { buildPool } from '../src/generator.ts';
import { DICTIONARY_OPTIONS, dictionaryKey } from '../src/dictionary-settings.ts';
import type { DictionaryKey, DictionarySetting, DisplayWord } from '../src/types.ts';
import { readDictionaryRows } from './data.ts';

const rows = readDictionaryRows();
const output = new URL('../public/dictionaries/', import.meta.url);
const generated = new URL('../src/generated/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
mkdirSync(generated, { recursive: true });
const settings: Partial<Record<DictionaryKey, DictionarySetting>> = {};
const entries = new Map<string, DisplayWord & { mask: number }>();

for (const [bit, options] of DICTIONARY_OPTIONS.entries()) {
  const pool = buildPool(rows, options);
  if (pool.some(({ token, hint }) => /[\r\n\t]/.test(token + hint)))
    throw new Error('Dictionary contains a delimiter');
  const mask = 1 << bit;
  settings[dictionaryKey(options)] = { count: pool.length, mask };
  for (const { token, hint } of pool) {
    const key = `${token}\t${hint}`;
    const previous = entries.get(key);
    if (previous) previous.mask |= mask;
    else entries.set(key, { token, hint, mask });
  }
}

const combined = [...entries.values()].sort(
  (a, b) => a.token.localeCompare(b.token, 'en') || a.hint.localeCompare(b.hint, 'ja'),
);
const text = combined.map(({ token, hint, mask }) => `${token}\t${hint}\t${mask}`).join('\n');
const hash = createHash('sha256').update(text).digest('hex').slice(0, 12);
const filename = `words-${hash}.txt`;
writeFileSync(new URL(filename, output), text);
writeFileSync(
  new URL('dictionaries.json', generated),
  JSON.stringify({ count: combined.length, url: `/dictionaries/${filename}`, settings }),
);
console.log(`Compiled one dictionary (${combined.length} entries) for all 8 settings.`);
