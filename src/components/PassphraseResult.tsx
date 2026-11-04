import { For, Show } from 'solid-js';
import type { DisplayWord } from '../types.ts';
import type { GenerationMeasurement } from '../hooks/use-passphrase.ts';
import { usePhraseFit } from '../hooks/use-phrase-fit.ts';
import { useReadyMeasurement } from '../hooks/use-ready-measurement.ts';
import { Icon } from './Icon.tsx';
import { EntropyGuide } from './EntropyGuide.tsx';

interface ResultProps {
  words: readonly DisplayWord[];
  phrase: string;
  count: number;
  bits: number;
  loading: boolean;
  error: string;
  copied: boolean;
  copyError: string;
  revision: number;
  measurement: GenerationMeasurement | undefined;
  dictionaryUrl: string;
  onRegenerate: () => void;
  onCopy: () => Promise<void>;
}

export function PassphraseResult(props: ResultProps) {
  let stage: HTMLDivElement | undefined;
  let list: HTMLDivElement | undefined;
  const scale = usePhraseFit(
    () => stage,
    () => list,
    () => props.count,
    () => props.words,
  );
  useReadyMeasurement(
    () => stage,
    () => props.measurement,
    props.dictionaryUrl,
  );

  return (
    <section class="result-card" aria-labelledby="result-title">
      <div class="result-heading">
        <h2 id="result-title">パスフレーズ</h2>
        <div class="result-entropy">
          エントロピー <strong>{props.bits.toFixed(1)}&nbsp;bit</strong>
        </div>
      </div>
      <div
        ref={(element) => {
          stage = element;
        }}
        class="word-stage"
        classList={{ 'many-words': props.count > 10 }}
        data-revision={props.revision}
        aria-busy={props.loading}
      >
        <Show
          when={!props.error}
          fallback={
            <div class="error-box" role="alert">
              {props.error}
            </div>
          }
        >
          <Show
            when={!props.loading}
            fallback={
              <span class="loading-status" role="status">
                読み込み中…
              </span>
            }
          >
            <div
              ref={(element) => {
                list = element;
              }}
              class="word-list"
              classList={{ 'single-line': props.count <= 6 }}
              style={{ '--phrase-scale': scale() }}
            >
              <For each={props.words}>
                {(word, index) => (
                  <div class="word-with-divider">
                    <div class="word-unit">
                      <span class="word-token">{word.token}</span>
                      <span class="word-hint">{word.hint}</span>
                    </div>
                    <Show when={index() < props.words.length - 1}>
                      <span class="word-hyphen" aria-hidden="true">
                        -
                      </span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
      <div class="result-actions">
        <button
          type="button"
          class="button button-secondary"
          disabled={props.loading}
          onClick={props.onRegenerate}
        >
          <Icon name="refresh" />
          再生成
        </button>
        <button
          type="button"
          class="button button-primary"
          classList={{ copied: props.copied }}
          disabled={!props.words.length}
          onClick={() => {
            void props.onCopy();
          }}
        >
          <Icon name={props.copied ? 'check' : 'copy'} />
          {props.copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <div class="screen-reader-status" role="status">
        {props.copied ? 'コピーしました。' : ''}
      </div>
      <Show when={props.copyError}>
        <p class="copy-feedback" role="alert">
          {props.copyError}
        </p>
        <textarea
          class="manual-copy"
          aria-label="手動コピー用パスフレーズ"
          readOnly
          value={props.phrase}
          onFocus={(event) => event.currentTarget.select()}
        />
      </Show>
      <EntropyGuide bits={props.bits} ready={props.words.length > 0} />
    </section>
  );
}
