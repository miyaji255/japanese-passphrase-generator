import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, vi } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'solid-js/web';
import { createSignal } from 'solid-js';
import App from '../src/App.tsx';
import { readManifest } from '../scripts/data.ts';
import { useClipboard } from '../src/hooks/use-clipboard.ts';

function input(id: string, value: number) {
  const element = document.getElementById(id);
  assert(element instanceof HTMLInputElement);
  element.value = String(value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

test('generation, synchronized sliders, setting downloads and copy work after one dictionary request', async () => {
  const manifest = readManifest();
  const dictionary = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), `../public${manifest.url}`),
    'utf8',
  );
  const fetcher = vi.fn(async () => ({ ok: true, text: async () => dictionary }));
  vi.stubGlobal('fetch', fetcher);
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const root = document.createElement('div');
  document.body.append(root);
  const dispose = render(() => <App />, root);
  try {
    await vi.waitFor(() => assert.equal(root.querySelectorAll('.word-token').length, 6));
    assert.equal(fetcher.mock.calls.length, 1);
    const button = root.querySelector('.button-primary');
    assert(button instanceof HTMLButtonElement);
    const phrase = [...root.querySelectorAll('.word-token')]
      .map((word) => word.textContent)
      .join('-');
    button.click();
    await vi.waitFor(() => assert(root.textContent?.includes('コピーしました')));
    assert.equal(copy.mock.calls[0]?.[0], phrase);

    input('word-count', 1);
    assert.equal(root.querySelectorAll('.word-token').length, 1);
    input('minimum-bits', 80);
    assert.equal(root.querySelectorAll('.word-token').length, 6);
    const toggles = root.querySelectorAll('.switch input');
    assert(toggles[0] instanceof HTMLInputElement);
    toggles[0].click();
    assert.equal(fetcher.mock.calls.length, 1);
    assert(
      root.querySelector('[download]')?.getAttribute('href')?.endsWith('/words-0-1-short.zip'),
    );
    assert(
      root.querySelector('a[href="https://github.com/miyaji255/japanese-passphrase-generator"]'),
    );

    copy.mockRejectedValueOnce(new Error('Clipboard unavailable'));
    button.click();
    await vi.waitFor(() => assert(root.querySelector('.manual-copy')));
    const textarea = root.querySelector('.manual-copy');
    assert(textarea instanceof HTMLTextAreaElement);
    assert.equal(
      textarea.value,
      [...root.querySelectorAll('.word-token')].map((word) => word.textContent).join('-'),
    );
    root.querySelector<HTMLButtonElement>('.button-secondary')?.click();
    assert.equal(root.querySelector('.manual-copy'), null);
    assert.equal(root.querySelectorAll('.word-hint').length, 6);
  } finally {
    dispose();
    root.remove();
  }
});

test('a failed clipboard request for an old phrase cannot replace the new phrase state', async () => {
  let rejectCopy: ((reason: Error) => void) | undefined;
  const pending = new Promise<void>((_, reject) => {
    rejectCopy = reject;
  });
  vi.spyOn(navigator.clipboard, 'writeText').mockReturnValueOnce(pending);
  const [phrase, setPhrase] = createSignal('tokyo-apple');
  const [revision, setRevision] = createSignal(0);
  let clipboard: ReturnType<typeof useClipboard> | undefined;
  const root = document.createElement('div');
  const dispose = render(() => {
    clipboard = useClipboard(phrase, revision);
    return <div />;
  }, root);
  try {
    assert(clipboard);
    const copying = clipboard.copy();
    setPhrase('kyoto-banana');
    setRevision(1);
    assert(rejectCopy);
    rejectCopy(new Error('Old request failed'));
    await copying;
    assert.equal(clipboard.error(), '');
    assert.equal(clipboard.copied(), false);
  } finally {
    dispose();
  }
});

test('copy completion belongs to its generation even if the same phrase is generated again', async () => {
  let resolveCopy: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    resolveCopy = resolve;
  });
  vi.spyOn(navigator.clipboard, 'writeText').mockReturnValueOnce(pending);
  const [revision, setRevision] = createSignal(0);
  let clipboard: ReturnType<typeof useClipboard> | undefined;
  const root = document.createElement('div');
  const dispose = render(() => {
    clipboard = useClipboard(() => 'tokyo-apple', revision);
    return <div />;
  }, root);
  try {
    assert(clipboard);
    const copying = clipboard.copy();
    setRevision(1);
    assert(resolveCopy);
    resolveCopy();
    await copying;
    assert.equal(clipboard.copied(), false);
  } finally {
    dispose();
  }
});
