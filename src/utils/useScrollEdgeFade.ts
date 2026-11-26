import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollEdgeFade<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  const [fade, setFade] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: false,
  });

  const updateFade = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 4;
    if (!hasOverflow) {
      setFade((prev) => (prev.top || prev.bottom ? { top: false, bottom: false } : prev));
      return;
    }
    const showTop = el.scrollTop > 6;
    const showBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 6;
    setFade((prev) =>
      prev.top === showTop && prev.bottom === showBottom
        ? prev
        : { top: showTop, bottom: showBottom }
    );
  }, []);

  useEffect(() => {
    updateFade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFade, ...deps]);

  useEffect(() => {
    window.addEventListener('resize', updateFade, { passive: true });
    return () => window.removeEventListener('resize', updateFade);
  }, [updateFade]);

  const fadeClass =
    fade.top && fade.bottom
      ? 'toc-scroll-fade-both'
      : fade.top
      ? 'toc-scroll-fade-top'
      : fade.bottom
      ? 'toc-scroll-fade-bottom'
      : '';

  return { ref, onScroll: updateFade, fadeClass };
}
