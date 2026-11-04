import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DictionaryManifest, DictionaryRow } from '../src/types.ts';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), path), 'utf8'));
}

function isDictionaryRow(row: unknown): row is DictionaryRow {
  return (
    Array.isArray(row) &&
    row.length === 9 &&
    [0, 1, 2, 4, 5, 6].every((index) => typeof row[index] === 'string') &&
    (row[3] === 0 || row[3] === 1) &&
    typeof row[7] === 'number' &&
    (row[8] === 'E' || row[8] === 'G')
  );
}

export function readDictionaryRows(): DictionaryRow[] {
  const rows = readJson('../src/data/words.json');
  if (!Array.isArray(rows) || !rows.every(isDictionaryRow))
    throw new Error('Invalid dictionary rows');
  return rows;
}

export interface SourceAttribution {
  name: string;
  url: string;
  license: string;
  copyright: string;
}

export interface AdditionProvenance {
  source: string;
  source_file: string;
  source_row: number;
  kana_token: string;
  short_token: string;
  long_vowel_review?: unknown;
}

export interface ProvenanceData {
  sources: Record<string, SourceAttribution>;
  entries: Record<string, AdditionProvenance>;
}

export function readProvenance(): ProvenanceData {
  // Source-controlled metadata is checked against every exported row by the tests.
  return readJson('../src/data/addition-provenance.json') as ProvenanceData;
}

export function readManifest(): DictionaryManifest {
  return readJson('../src/generated/dictionaries.json') as DictionaryManifest;
}
