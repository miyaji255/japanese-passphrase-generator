import type { DictionaryKey, DictionaryOptions } from './types.ts';

export const DEFAULT_OPTIONS: Readonly<DictionaryOptions> = {
  english: true,
  long: true,
  romanization: 'short',
};

// Order is part of the compiled dictionary's eight-bit eligibility format.
export const DICTIONARY_OPTIONS: readonly DictionaryOptions[] = [false, true].flatMap((english) =>
  [false, true].flatMap((long) =>
    (['kana', 'short'] as const).map((romanization) => ({ english, long, romanization })),
  ),
);

export function dictionaryKey(options: DictionaryOptions): DictionaryKey {
  return `${options.english ? 1 : 0}-${options.long ? 1 : 0}-${options.romanization}`;
}
