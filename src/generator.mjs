// Dictionary row: id, kana token, short token, language (0=ja), hint,
// reading, meaning, mora, familiarity. Keep sampling over rendered strings.
export function buildPool(rows, { english = true, long = false, romanization = 'kana' } = {}) {
  const candidates = new Map();
  for (const row of rows) {
    const isJapanese = row[3] === 0;
    if (!english && !isJapanese) continue;
    const token = romanization === 'short' ? row[2] : row[1];
    if (!long && isJapanese && (row[7] >= 5 || token.length >= 9)) continue;
    const rank = (row[8] === 'E' ? 0 : 2) + (isJapanese ? 0 : 1);
    const previous = candidates.get(token);
    if (!previous || rank < previous.rank) candidates.set(token, {
      token, hint: row[4], reading: row[5], meaning: row[6],
      language: isJapanese ? 'ja' : 'en', id: row[0], rank,
    });
  }
  return [...candidates.values()].sort((a, b) => a.token.localeCompare(b.token, 'en'));
}

export function randomIndex(size, fill = array => globalThis.crypto.getRandomValues(array)) {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) throw new RangeError('Invalid pool size');
  const ceiling = 0x100000000 - (0x100000000 % size);
  const buffer = new Uint32Array(1);
  do { fill(buffer); } while (buffer[0] >= ceiling);
  return buffer[0] % size;
}

export function generateWords(pool, count, fill) {
  if (!pool.length || !Number.isInteger(count) || count < 1 || count > 256) throw new RangeError('Invalid generation settings');
  return Array.from({ length: count }, () => pool[randomIndex(pool.length, fill)]);
}

export function decodeWord(line) {
  const separator = line.indexOf('\t');
  return { token: line.slice(0, separator), hint: line.slice(separator + 1) };
}

export function entropyBits(size, count) {
  if (size < 2) throw new RangeError('At least two candidates required');
  return Math.log2(size) * count;
}

export function wordsForEntropy(size, minimumBits) {
  if (!Number.isFinite(minimumBits) || minimumBits <= 0 || size < 2) throw new RangeError('Invalid entropy target');
  return Math.ceil(minimumBits / Math.log2(size));
}

export function joinWords(words) { return words.map(word => word.token).join('-'); }
