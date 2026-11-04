import type { DictionarySetting } from './types.ts';

export interface ParsedDictionary {
  words: string[];
  masks: Uint8Array;
}

export interface DictionaryTiming {
  requested: number;
  received: number;
  validationMs: number;
}

interface DictionaryResponse {
  ok: boolean;
  text?: () => Promise<string>;
}

export type DictionaryFetcher = (url: string) => DictionaryResponse | Promise<DictionaryResponse>;
export type DictionaryPool = readonly string[];

const timings = new WeakMap<ParsedDictionary | DictionaryPool, DictionaryTiming>();
const pools = new WeakMap<ParsedDictionary, Map<number, DictionaryPool>>();

export function getDictionaryTimings(words: DictionaryPool): DictionaryTiming | undefined {
  return timings.get(words);
}

function isSettingMask(mask: number): boolean {
  return Number.isInteger(mask) && mask >= 1 && mask <= 128 && (mask & (mask - 1)) === 0;
}

export function parseDictionary(
  text: string,
  expectedCount: number,
  settings: Readonly<Record<string, DictionarySetting>> = {},
): ParsedDictionary {
  const lines = text.split('\n');
  if (!Number.isInteger(expectedCount) || expectedCount < 1 || lines.length !== expectedCount) {
    throw new Error('Incomplete dictionary');
  }
  const words: string[] = [];
  const masks = new Uint8Array(lines.length);
  const counts = new Uint32Array(8);
  for (const [index, line] of lines.entries()) {
    const separator = line.lastIndexOf('\t');
    const mask = Number(line.slice(separator + 1));
    const word = line.slice(0, separator);
    const hintSeparator = word.indexOf('\t');
    if (
      separator < 0 ||
      hintSeparator < 1 ||
      hintSeparator === word.length - 1 ||
      word.indexOf('\t', hintSeparator + 1) !== -1 ||
      !Number.isInteger(mask) ||
      mask < 1 ||
      mask > 255
    ) {
      throw new Error('Invalid dictionary entry');
    }
    words.push(word);
    masks[index] = mask;
    for (let bit = 0; bit < 8; bit++) if (mask & (1 << bit)) counts[bit] = counts[bit]! + 1;
  }
  for (const { mask, count } of Object.values(settings)) {
    if (
      !isSettingMask(mask) ||
      !Number.isInteger(count) ||
      count < 1 ||
      counts[Math.log2(mask)] !== count
    ) {
      throw new Error('Incomplete dictionary setting');
    }
  }
  return { words, masks };
}

export function selectDictionaryPool(dictionary: ParsedDictionary, mask: number): DictionaryPool {
  if (!isSettingMask(mask)) throw new RangeError('Invalid dictionary setting');
  let cached = pools.get(dictionary);
  if (!cached) {
    cached = new Map();
    pools.set(dictionary, cached);
  }
  const existing = cached.get(mask);
  if (existing) return existing;
  const started = performance.now();
  const selected = dictionary.words.filter((_, index) => dictionary.masks[index]! & mask);
  const timing = timings.get(dictionary);
  if (timing)
    timings.set(selected, {
      ...timing,
      validationMs: timing.validationMs + performance.now() - started,
    });
  cached.set(mask, selected);
  return selected;
}

export function createDictionaryLoader(fetcher: DictionaryFetcher = (url) => fetch(url)) {
  const cache = new Map<string, Promise<ParsedDictionary>>();
  return function load(
    url: string,
    expectedCount: number,
    settings?: Readonly<Record<string, DictionarySetting>>,
  ) {
    const existing = cache.get(url);
    if (existing) return existing;
    let requested = 0;
    const request = Promise.resolve()
      .then(() => {
        requested = performance.now();
        return fetcher(url);
      })
      .then((response) => {
        if (!response.ok || !response.text) throw new Error('Dictionary request failed');
        return response.text();
      })
      .then((text) => {
        const received = performance.now();
        const dictionary = parseDictionary(text, expectedCount, settings);
        timings.set(dictionary, {
          requested,
          received,
          validationMs: performance.now() - received,
        });
        return dictionary;
      })
      .catch((error: unknown) => {
        cache.delete(url);
        throw error;
      });
    cache.set(url, request);
    return request;
  };
}

export const loadDictionary = createDictionaryLoader();
