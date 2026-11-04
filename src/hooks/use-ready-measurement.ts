import { createEffect, onCleanup } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { GenerationMeasurement } from './use-passphrase.ts';

export function useReadyMeasurement(
  stage: Accessor<HTMLDivElement | undefined>,
  sample: Accessor<GenerationMeasurement | undefined>,
  dictionaryUrl: string,
) {
  let frame = 0;
  createEffect(() => {
    const measurement = sample();
    if (!measurement) return;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const element = stage();
        if (!element) return;
        performance.mark('passphrase-ready');
        element.dataset.readyMs = String(Math.round(performance.now()));
        const navigation = performance.getEntriesByType('navigation')[0] as
          | PerformanceNavigationTiming
          | undefined;
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        if (navigation) element.dataset.documentMs = String(Math.round(navigation.responseEnd));
        if (fcp) element.dataset.fcpMs = String(Math.round(fcp.startTime));
        if (measurement.timing) {
          const resource = performance
            .getEntriesByName(new URL(dictionaryUrl, document.baseURI).href)
            .filter((entry) => entry.entryType === 'resource')
            .at(-1);
          element.dataset.phaseMs = JSON.stringify({
            downloadMs:
              resource?.duration ?? measurement.timing.received - measurement.timing.requested,
            fetchWaitMs: measurement.timing.received - measurement.timing.requested,
            validationMs: measurement.timing.validationMs,
            selectionMs: measurement.selectionMs,
          });
        }
      });
    });
  });
  onCleanup(() => {
    if (frame) cancelAnimationFrame(frame);
  });
}
