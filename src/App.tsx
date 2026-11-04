import { createMemo, createSignal } from 'solid-js';
import { dictionaryManifest } from './dictionary-manifest.ts';
import { DEFAULT_OPTIONS, dictionaryKey } from './dictionary-settings.ts';
import { DEFAULT_WORD_COUNT, resolveLength } from './length-settings.ts';
import type { DictionaryOptions, LengthSelection } from './types.ts';
import { usePassphrase } from './hooks/use-passphrase.ts';
import { useClipboard } from './hooks/use-clipboard.ts';
import { PassphraseResult } from './components/PassphraseResult.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { SourceFooter } from './components/SourceFooter.tsx';

export default function App() {
  const [options, setOptions] = createSignal<DictionaryOptions>({ ...DEFAULT_OPTIONS });
  const [selection, setSelection] = createSignal<LengthSelection>({
    mode: 'words',
    value: DEFAULT_WORD_COUNT,
  });
  const length = createMemo(() =>
    resolveLength(selection(), dictionaryManifest.settings[dictionaryKey(options())].count),
  );
  const generator = usePassphrase(options, () => length().count);
  const clipboard = useClipboard(generator.phrase, generator.revision);

  return (
    <>
      <main>
        <h1 class="page-title">日本語パスフレーズジェネレーター</h1>
        <div class="workspace">
          <PassphraseResult
            words={generator.words()}
            phrase={generator.phrase()}
            count={length().count}
            bits={length().bits}
            loading={generator.loading()}
            error={generator.error()}
            copied={clipboard.copied()}
            copyError={clipboard.error()}
            onRegenerate={generator.regenerate}
            onCopy={clipboard.copy}
          />
          <SettingsPanel
            count={length().count}
            minimumBits={length().minimumBits}
            maximumBits={length().maximumBits}
            options={options()}
            onCount={(value) => setSelection({ mode: 'words', value })}
            onMinimumBits={(value) => setSelection({ mode: 'entropy', value })}
            onOptions={(change) => setOptions((current) => ({ ...current, ...change }))}
          />
        </div>
      </main>
      <SourceFooter options={options()} />
    </>
  );
}
