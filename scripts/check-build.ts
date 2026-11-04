import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readManifest } from './data.ts';
import { DICTIONARY_OPTIONS, dictionaryKey } from '../src/dictionary-settings.ts';

const base = process.env.BASE_PATH || '/';
assert(base.startsWith('/') && base.endsWith('/'), 'BASE_PATH must start and end with /');
const output = resolve('dist');
const html = readFileSync(resolve(output, 'index.html'), 'utf8');
const manifest = readManifest();
const dictionaryUrl = `${base}${manifest.url.replace(/^\//, '')}`;
assert(
  html.includes(`href="${dictionaryUrl}"`),
  'Dictionary preload must use the deployment base path',
);
assert(html.includes('<h1'), 'Static UI must be prerendered');
assert(/<astro-island\b[^>]*client="load"/.test(html), 'Solid must hydrate on page load');
assert(html.includes('読み込み中…'), 'The static page must contain the loading state');
assert(
  !/<span\b[^>]*class="word-token"/.test(html),
  'Generated passphrases must never be baked into static HTML',
);
assert(/<style(?:\s[^>]*)?>/.test(html), 'CSS must be inlined');
for (const match of html.matchAll(
  /(?:href|src|component-url|renderer-url)="(\/[^"#?]*)(?:[?#][^"]*)?"/g,
)) {
  const url = match[1];
  assert(url);
  assert(url.startsWith(base), `Root-relative link bypasses the deployment base: ${url}`);
  assert(existsSync(resolve(output, url.slice(base.length))), `Missing static asset: ${url}`);
}
assert.equal(readdirSync(resolve(output, 'dictionaries')).length, 1);
assert.equal(
  readFileSync(resolve(output, manifest.url.slice(1)), 'utf8').split('\n').length,
  manifest.count,
);
for (const options of DICTIONARY_OPTIONS) {
  assert(existsSync(resolve(output, `wordlists/words-${dictionaryKey(options)}.zip`)));
}
const commitSha = process.env.PUBLIC_COMMIT_SHA || process.env.WORKERS_CI_COMMIT_SHA;
if (commitSha) {
  assert(html.includes(`/tree/${commitSha}`), 'Source link must identify the deployed commit');
}
console.log(`Verified prerendering, links, dictionary and all downloads under ${base}`);
