import { entropyBits, wordsForEntropy } from './generator.ts';
import type { LengthSelection } from './types.ts';

export const DEFAULT_WORD_COUNT = 6;
export const MAX_WORD_COUNT = 20;

export function resolveLength(selection: LengthSelection, poolSize: number) {
  const maximumBits = Math.floor(entropyBits(poolSize, MAX_WORD_COUNT));
  const target = Math.min(selection.value, maximumBits);
  const count = selection.mode === 'words' ? selection.value : wordsForEntropy(poolSize, target);
  const bits = entropyBits(poolSize, count);
  return {
    count,
    bits,
    maximumBits,
    minimumBits: selection.mode === 'words' ? Math.floor(bits) : target,
  };
}
