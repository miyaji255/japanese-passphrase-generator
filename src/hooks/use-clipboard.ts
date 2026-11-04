import { createEffect, createSignal, onCleanup } from 'solid-js';
import type { Accessor } from 'solid-js';

export function useClipboard(phrase: Accessor<string>, revision: Accessor<number>) {
  const [copied, setCopied] = createSignal(false);
  const [error, setError] = createSignal('');
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function reset() {
    clearTimeout(timeout);
    setCopied(false);
    setError('');
  }

  createEffect(() => {
    revision();
    reset();
  });
  onCleanup(() => clearTimeout(timeout));

  async function copy() {
    const text = phrase();
    const version = revision();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (phrase() !== text || revision() !== version) return;
      clearTimeout(timeout);
      setCopied(true);
      setError('');
      timeout = setTimeout(() => setCopied(false), 2400);
    } catch {
      // A previous copy attempt must not overwrite the state of a newer phrase.
      if (phrase() !== text || revision() !== version) return;
      setCopied(false);
      setError('コピーできませんでした。下の文字列を選択してコピーしてください。');
    }
  }

  return { copied, error, copy };
}
