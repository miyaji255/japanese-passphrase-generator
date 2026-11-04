import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { DisplayWord } from '../types.ts';

export function usePhraseFit(
  stage: Accessor<HTMLDivElement | undefined>,
  list: Accessor<HTMLDivElement | undefined>,
  count: Accessor<number>,
  words: Accessor<readonly DisplayWord[]>,
) {
  const [scale, setScale] = createSignal(1);
  let frame = 0;
  let observer: ResizeObserver | undefined;

  function fit() {
    const container = stage();
    const content = list();
    if (!container || !content || count() > 6) {
      setScale(1);
      return;
    }
    const style = getComputedStyle(container);
    const available =
      container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const natural = content.scrollWidth;
    setScale(available > 1 && natural > 0 ? Math.min(1, (available - 1) / natural) : 1);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  }

  createEffect(() => {
    words();
    count();
    schedule();
  });
  onMount(() => {
    const element = stage();
    if (element) {
      observer = new ResizeObserver(schedule);
      observer.observe(element);
    }
  });
  onCleanup(() => {
    observer?.disconnect();
    if (frame) cancelAnimationFrame(frame);
  });
  return scale;
}
