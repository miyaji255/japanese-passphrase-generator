import { createSignal } from 'solid-js';
import { MAX_WORD_COUNT } from '../length-settings.ts';
import type { DictionaryOptions } from '../types.ts';
import { LengthControl, Toggle } from './Controls.tsx';

interface SettingsProps {
  count: number;
  minimumBits: number;
  maximumBits: number;
  options: DictionaryOptions;
  onCount: (count: number) => void;
  onMinimumBits: (bits: number) => void;
  onOptions: (change: Partial<DictionaryOptions>) => void;
}

export function SettingsPanel(props: SettingsProps) {
  const [helpOpen, setHelpOpen] = createSignal(false);
  return (
    <aside class="settings-card" aria-labelledby="settings-title">
      <h2 id="settings-title" class="settings-heading">
        生成設定
      </h2>
      <LengthControl
        id="word-count"
        label="単語数"
        unit="語"
        value={props.count}
        max={MAX_WORD_COUNT}
        onChange={props.onCount}
      />
      <LengthControl
        id="minimum-bits"
        label="最低エントロピー"
        unit="bit"
        value={props.minimumBits}
        max={props.maximumBits}
        onChange={props.onMinimumBits}
      />
      <div class="settings-divider" />
      <div class="dictionary-controls">
        <Toggle
          title="英単語も含める"
          checked={props.options.english}
          onChange={(english) => props.onOptions({ english })}
        />
        <Toggle
          title="長い単語も含める"
          checked={props.options.long}
          onChange={(long) => props.onOptions({ long })}
        />
        <div class="toggle-with-help">
          <Toggle
            title="長音を短くする"
            checked={props.options.romanization === 'short'}
            onChange={(short) => props.onOptions({ romanization: short ? 'short' : 'kana' })}
          />
          <span
            class="vowel-help"
            onMouseEnter={() => setHelpOpen(true)}
            onMouseLeave={() => setHelpOpen(false)}
          >
            <button
              type="button"
              class="help-button"
              aria-label="長音の短縮について"
              aria-describedby="vowel-help-text"
              onFocus={() => setHelpOpen(true)}
              onBlur={() => setHelpOpen(false)}
              onClick={() => setHelpOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setHelpOpen(false);
              }}
            >
              ?
            </button>
            <span id="vowel-help-text" class="help-tooltip" role="tooltip" hidden={!helpOpen()}>
              東京の <code>toukyou → tokyo</code>、社長の <code>shachou → shacho</code>{' '}
              のような短い表記にします。
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
