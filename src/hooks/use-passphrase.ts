import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { Accessor } from 'solid-js';
import { dictionaryManifest as manifest } from '../dictionary-manifest.ts';
import { assetUrl } from '../asset-url.ts';
import { dictionaryKey } from '../dictionary-settings.ts';
import {
  loadDictionary,
  selectDictionaryPool,
  getDictionaryTimings,
} from '../dictionary-loader.ts';
import type { DictionaryPool, DictionaryTiming, ParsedDictionary } from '../dictionary-loader.ts';
import { decodeWord, generateWords, joinWords } from '../generator.ts';
import type { DictionaryOptions, DisplayWord } from '../types.ts';

export interface GenerationMeasurement {
  timing: DictionaryTiming | undefined;
  selectionMs: number;
}

export function usePassphrase(options: Accessor<DictionaryOptions>, count: Accessor<number>) {
  const [words, setWords] = createSignal<DisplayWord[]>([]);
  const [loaded, setLoaded] = createSignal<ParsedDictionary>();
  const [loadError, setLoadError] = createSignal('');
  const [generationError, setGenerationError] = createSignal('');
  const [attempt, setAttempt] = createSignal(0);
  const [revision, setRevision] = createSignal(0);
  const [measurement, setMeasurement] = createSignal<GenerationMeasurement>();
  let measured = false;
  const info = createMemo(() => manifest.settings[dictionaryKey(options())]);
  const pool = createMemo(() => {
    const dictionary = loaded();
    return dictionary ? selectDictionaryPool(dictionary, info().mask) : undefined;
  });

  createEffect(() => {
    attempt();
    let active = true;
    setLoadError('');
    void loadDictionary(assetUrl(manifest.url), manifest.count, manifest.settings)
      .then((dictionary) => {
        if (active) setLoaded(dictionary);
      })
      .catch(() => {
        if (active) setLoadError('単語リストを読み込めませんでした。再生成で再試行してください。');
      });
    onCleanup(() => {
      active = false;
    });
  });

  function generate(available: DictionaryPool, length: number) {
    setRevision((value) => value + 1);
    try {
      const started = performance.now();
      const selected = generateWords(available, length).map(decodeWord);
      const selectionMs = performance.now() - started;
      setWords(selected);
      setGenerationError('');
      if (!measured) {
        measured = true;
        setMeasurement({ timing: getDictionaryTimings(available), selectionMs });
      }
    } catch {
      setWords([]);
      setGenerationError(
        '暗号学的な乱数を利用できません。HTTPSで、対応ブラウザーから開いてください。',
      );
    }
  }

  createEffect(() => {
    const available = pool();
    const length = count();
    setWords([]);
    if (available) generate(available, length);
  });

  function regenerate() {
    const available = pool();
    if (available) generate(available, count());
    else setAttempt((value) => value + 1);
  }

  return {
    words,
    info,
    revision,
    measurement,
    regenerate,
    dictionaryUrl: assetUrl(manifest.url),
    phrase: createMemo(() => joinWords(words())),
    loading: () => !pool() && !loadError(),
    error: () => loadError() || generationError(),
  };
}
