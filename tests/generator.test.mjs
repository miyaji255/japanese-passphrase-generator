import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPool, randomIndex, generateWords, entropyBits, wordsForEntropy, joinWords } from '../src/generator.mjs';
const rows = JSON.parse(fs.readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));

test('all dictionary settings produce the reviewed unique candidate counts', () => {
  for (const [romanization, english, long, expected] of [
    ['kana',true,false,16542],['kana',true,true,19171],
    ['kana',false,false,13945],['kana',false,true,16574],
    ['short',true,false,15815],['short',true,true,18316],
    ['short',false,false,13230],['short',false,true,15731],
  ]) {
    const pool = buildPool(rows, {romanization,english,long});
    assert.equal(pool.length, expected);
    assert.equal(new Set(pool.map(w=>w.token)).size, expected);
    assert(pool.every(w=>/^[a-z]+$/.test(w.token) && w.hint));
    if (!english) assert(pool.every(w=>w.language==='ja'));
    if (!long) assert(pool.every(w=>w.token.length<=8));
  }
});

test('hints follow eligible entries, not removed English or long-word entries', () => {
  const pool = buildPool(rows, {english:false,romanization:'short'});
  assert.equal(pool.find(w=>w.token==='tokyo').hint,'東京');
  assert.equal(pool.find(w=>w.token==='mino').language,'ja');
  const english = buildPool(rows).find(w=>w.token==='apple');
  assert.equal(english.hint,'アップル');
  assert.equal(english.meaning,'りんご');
});

test('rejection sampling discards the biased tail, including its boundary', () => {
  const values=[0xffffffff,0xfffffffa,7]; let calls=0;
  assert.equal(randomIndex(10,buffer=>{buffer[0]=values[calls++]}),7);
  assert.equal(calls,3);
  assert.equal(randomIndex(1,buffer=>{buffer[0]=0xffffffff}),0);
});

test('minimum-bit mode uses full precision and rounds word count upwards', () => {
  assert.equal(wordsForEntropy(14238,64),5);
  assert.equal(wordsForEntropy(14238,80),6);
  assert.equal(wordsForEntropy(14238,69),6); // five words are 68.987..., not 69.
  for (const size of [14238,15451,13605,14698,11006,12839]) {
    for (const bits of [1,32,64,69,77,80,128,256]) {
      const count=wordsForEntropy(size,bits);
      assert(entropyBits(size,count)>=bits);
      if(count>1)assert(entropyBits(size,count-1)<bits);
    }
  }
});

test('independent draws allow repeats; copied text contains only tokens and hyphens', () => {
  const pool=[{token:'apple',hint:'アップル'},{token:'tokyo',hint:'東京'}];
  const result=generateWords(pool,1,buffer=>{buffer[0]=0});
  assert.equal(joinWords(result),'apple');
  assert.equal(joinWords(generateWords(pool,3,buffer=>{buffer[0]=1})),'tokyo-tokyo-tokyo');
});
