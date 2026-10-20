import { useEffect, useRef, useState } from 'react';

const getMotionQuery = () => {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)');
  } catch {
    return undefined;
  }
};

export function useAnimationEnabled() {
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(
    () => getMotionQuery()?.matches ?? false
  );

  useEffect(() => {
    const query = getMotionQuery();
    const onVisibility = () => setPageVisible(!document.hidden);
    const onMotion = () => setReducedMotion(query?.matches ?? false);
    document.addEventListener('visibilitychange', onVisibility);
    if (query?.addEventListener) query.addEventListener('change', onMotion);
    else query?.addListener(onMotion);
    onVisibility();
    onMotion();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (query?.removeEventListener)
        query.removeEventListener('change', onMotion);
      else query?.removeListener(onMotion);
    };
  }, []);

  return pageVisible && !reducedMotion;
}

export function useAnimationActivity() {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useAnimationEnabled();
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, active: enabled && inView };
}

/** Limit stateful demonstrations to 30Hz and discard elapsed time while paused. */
export function useDemoAnimationFrame(
  active: boolean,
  onFrame: (delta: number) => void
) {
  const callback = useRef(onFrame);
  useEffect(() => {
    callback.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!active) return;
    let lastTime: number | undefined;
    let frame: number;
    const animate = (time: number) => {
      if (lastTime === undefined) lastTime = time;
      const delta = time - lastTime;
      if (delta >= 1000 / 30) {
        lastTime = time;
        callback.current(delta);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
