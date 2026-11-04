export type Romanization = 'kana' | 'short';

export interface DictionaryOptions {
  english: boolean;
  long: boolean;
  romanization: Romanization;
}

export type DictionaryKey = `${0 | 1}-${0 | 1}-${Romanization}`;

export interface DictionarySetting {
  count: number;
  mask: number;
}

export interface DictionaryManifest {
  count: number;
  url: string;
  settings: Record<DictionaryKey, DictionarySetting>;
}

export type DictionaryRow = readonly [
  id: string,
  kanaToken: string,
  shortToken: string,
  language: 0 | 1,
  hint: string,
  reading: string,
  meaning: string,
  mora: number,
  familiarity: 'E' | 'G',
];

export interface DisplayWord {
  token: string;
  hint: string;
}

export interface PoolWord extends DisplayWord {
  reading: string;
  meaning: string;
  language: 'ja' | 'en';
  id: string;
  rank: number;
}

export type RandomFill = (buffer: Uint32Array<ArrayBuffer>) => unknown;

export type LengthSelection = { mode: 'words'; value: number } | { mode: 'entropy'; value: number };
