import { useLayoutEffect, useRef } from 'react';

// Last-resort safety net: shrink font-size (within [minPx, maxPx]) until the
// element's content fits on a single line. Segmentation should already keep
// lines short; this just guarantees no wrapping/clipping at any viewport.
export function useFitSingleLine(text, { minPx = 16, maxPx = 30 } = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const fit = () => {
      if (!element.clientWidth) return;
      let low = minPx;
      let high = maxPx;
      element.style.whiteSpace = 'nowrap';

      for (let i = 0; i < 9; i += 1) {
        const mid = (low + high) / 2;
        element.style.fontSize = `${mid}px`;
        if (element.scrollWidth <= element.clientWidth + 1) low = mid;
        else high = mid;
      }
      element.style.fontSize = `${low}px`;
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, minPx, maxPx]);

  return ref;
}
