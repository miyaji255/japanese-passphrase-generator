import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { buildPool } from '../src/generator.mjs';

const rows = JSON.parse(readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));
const output = new URL('../public/dictionaries/', import.meta.url);
const generated = new URL('../src/generated/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
mkdirSync(generated, { recursive: true });
const settings = {};
const entries = new Map();
let bit = 0;

for (const english of [false, true]) {
  for (const long of [false, true]) {
    for (const romanization of ['kana', 'short']) {
      const key = `${Number(english)}-${Number(long)}-${romanization}`;
      // Resolve eligibility and duplicate hints before merging settings.
      const pool = buildPool(rows, { english, long, romanization });
      if (pool.some(({token,hint}) => /[\r\n\t]/.test(token + hint))) {
        throw new Error('Dictionary contains a delimiter');
      }
      const mask = 1 << bit++;
      settings[key] = { count: pool.length, mask };
      for (const { token, hint } of pool) {
        const entryKey = `${token}\t${hint}`;
        const previous = entries.get(entryKey);
        if (previous) previous.mask |= mask;
        else entries.set(entryKey, { token, hint, mask });
      }
    }
  }
}

// One sorted list preserves each original pool's token order after bit filtering.
const combined = [...entries.values()].sort((a, b) =>
  a.token.localeCompare(b.token, 'en') || a.hint.localeCompare(b.hint, 'ja'));
const text = combined.map(({ token, hint, mask }) => `${token}\t${hint}\t${mask}`).join('\n');
const hash = createHash('sha256').update(text).digest('hex').slice(0, 12);
const filename = `words-${hash}.txt`;
writeFileSync(new URL(filename, output), text);
const manifest = { count: combined.length, url: `/dictionaries/${filename}`, settings };
writeFileSync(new URL('dictionaries.json', generated), JSON.stringify(manifest));
console.log(`Compiled one dictionary (${combined.length} entries) for all 8 settings.`);
