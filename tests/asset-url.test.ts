import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { assetUrl } from '../src/asset-url.ts';

test('dictionary and download URLs stay under the deployment path', () => {
  for (const base of ['/', '/japanese-passphrase-generator/']) {
    for (const path of [
      '/dictionaries/words-hash.txt',
      '/wordlists/words-1-1-short.zip',
      '/licenses/ADDITIONS-NOTICE.txt',
    ]) {
      assert.equal(assetUrl(path, base), base + path.slice(1));
    }
  }
});
