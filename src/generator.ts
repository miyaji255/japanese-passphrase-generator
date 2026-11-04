import type {
  DictionaryOptions,
  DictionaryRow,
  DisplayWord,
  PoolWord,
  RandomFill,
} from './types.ts';

export function buildPool(
  rows: readonly DictionaryRow[],
  { english = true, long = false, romanization = 'kana' }: Partial<DictionaryOptions> = {},
): PoolWord[] {
  const candidates = new Map<string, PoolWord>();
  for (const row of rows) {
    const isJapanese = row[3] === 0;
    if (!english && !isJapanese) continue;
    const token = romanization === 'short' ? row[2] : row[1];
    if (!long && isJapanese && (row[7] >= 5 || token.length >= 9)) continue;
    const rank = (row[8] === 'E' ? 0 : 2) + (isJapanese ? 0 : 1);
    const previous = candidates.get(token);
    if (!previous || rank < previous.rank) {
      candidates.set(token, {
        token,
        hint: row[4],
        reading: row[5],
        meaning: row[6],
        language: isJapanese ? 'ja' : 'en',
        id: row[0],
        rank,
      });
    }
  }
  return [...candidates.values()].sort((a, b) => a.token.localeCompare(b.token, 'en'));
}

export function randomIndex(
  size: number,
  fill: RandomFill = (buffer) => globalThis.crypto.getRandomValues(buffer),
): number {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) {
    throw new RangeError('Invalid pool size');
  }
  const ceiling = 0x100000000 - (0x100000000 % size);
  const buffer = new Uint32Array(1);
  do {
    fill(buffer);
  } while (buffer[0]! >= ceiling);
  return buffer[0]! % size;
}

export function generateWords<T>(pool: readonly T[], count: number, fill?: RandomFill): T[] {
  if (!pool.length || !Number.isInteger(count) || count < 1 || count > 256) {
    throw new RangeError('Invalid generation settings');
  }
  return Array.from({ length: count }, () => pool[randomIndex(pool.length, fill)]!);
}

export function decodeWord(line: string): DisplayWord {
  const separator = line.indexOf('\t');
  if (separator < 1 || separator === line.length - 1) throw new Error('Invalid dictionary word');
  return { token: line.slice(0, separator), hint: line.slice(separator + 1) };
}

export function entropyBits(size: number, count: number): number {
  if (size < 2) throw new RangeError('At least two candidates required');
  return Math.log2(size) * count;
}

export function wordsForEntropy(size: number, minimumBits: number): number {
  if (!Number.isFinite(minimumBits) || minimumBits <= 0 || size < 2) {
    throw new RangeError('Invalid entropy target');
  }
  return Math.ceil(minimumBits / Math.log2(size));
}

export function joinWords(words: readonly DisplayWord[]): string {
  return words.map((word) => word.token).join('-');
}
