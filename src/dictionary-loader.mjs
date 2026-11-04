const timings = new WeakMap();
const pools = new WeakMap();

export function getDictionaryTimings(words) {
  return timings.get(words);
}

export function parseDictionary(text, expectedCount, settings = {}) {
  const lines = text.split('\n');
  if (lines.length !== expectedCount) throw new Error('Incomplete dictionary');
  const words = new Array(lines.length);
  const masks = new Uint8Array(lines.length);
  const counts = new Uint32Array(8);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const separator = line.lastIndexOf('\t');
    const mask = Number(line.slice(separator + 1));
    const word = line.slice(0, separator);
    const hintSeparator = word.indexOf('\t');
    if (separator < 0 || hintSeparator < 1 || hintSeparator === word.length - 1 ||
        word.indexOf('\t', hintSeparator + 1) !== -1 ||
        !Number.isInteger(mask) || mask < 1 || mask > 255) {
      throw new Error('Invalid dictionary entry');
    }
    words[index] = word;
    masks[index] = mask;
    for (let bit = 0; bit < 8; bit++) if (mask & (1 << bit)) counts[bit]++;
  }
  for (const { mask, count } of Object.values(settings)) {
    if (counts[Math.log2(mask)] !== count) throw new Error('Incomplete dictionary setting');
  }
  return { words, masks };
}

export function selectDictionaryPool(dictionary, mask) {
  let cached = pools.get(dictionary);
  if (!cached) pools.set(dictionary, cached = new Map());
  if (!cached.has(mask)) {
    const started = performance.now();
    const selected = dictionary.words.filter((_, index) => dictionary.masks[index] & mask);
    const timing = timings.get(dictionary);
    if (timing) timings.set(selected, {
      ...timing, validationMs: timing.validationMs + performance.now() - started,
    });
    cached.set(mask, selected);
  }
  return cached.get(mask);
}

export function createDictionaryLoader(fetcher = (...args) => fetch(...args)) {
  const cache = new Map();
  return function load(url, expectedCount, settings) {
    if (!cache.has(url)) {
      let requested;
      const request = Promise.resolve().then(() => {
        requested = performance.now();
        return fetcher(url);
      }).then(response => {
        if (!response.ok) throw new Error('Dictionary request failed');
        return response.text();
      }).then(text => {
        const received = performance.now();
        const dictionary = parseDictionary(text, expectedCount, settings);
        timings.set(dictionary, { requested, received, validationMs: performance.now() - received });
        return dictionary;
      }).catch(error => {
        cache.delete(url);
        throw error;
      });
      cache.set(url, request);
    }
    return cache.get(url);
  };
}

export const loadDictionary = createDictionaryLoader();
