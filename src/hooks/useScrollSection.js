import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function useScrollSection(totalSections) {
  const maxPanel = Math.max(totalSections - 1, 0);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePanel, setActivePanel] = useState(0);
  const targetRef = useRef(0);
  const progressRef = useRef(0);
  const touchStartY = useRef(0);

  const setTarget = useCallback(
    (next) => {
      const value = clamp(next, 0, maxPanel);
      targetRef.current = value;

      if (prefersReducedMotion) {
        progressRef.current = value;
        setScrollProgress(value);
        setActivePanel(Math.round(value));
      }
    },
    [maxPanel, prefersReducedMotion]
  );

  const goToPanel = useCallback(
    (index) => {
      setTarget(index);
    },
    [setTarget]
  );

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    let frameId;

    const tick = () => {
      const next = progressRef.current + (targetRef.current - progressRef.current) * 0.095;
      progressRef.current = Math.abs(next - targetRef.current) < 0.001 ? targetRef.current : next;
      setScrollProgress(progressRef.current);
      setActivePanel(Math.round(progressRef.current));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const handleWheel = (event) => {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      event.preventDefault();
      setTarget(targetRef.current + event.deltaY * 0.0023);
    };

    const handleKeyDown = (event) => {
      const forwardKeys = ['ArrowDown', 'ArrowRight', 'PageDown', ' '];
      const backKeys = ['ArrowUp', 'ArrowLeft', 'PageUp'];

      if (forwardKeys.includes(event.key)) {
        event.preventDefault();
        setTarget(Math.round(targetRef.current) + 1);
      }

      if (backKeys.includes(event.key)) {
        event.preventDefault();
        setTarget(Math.round(targetRef.current) - 1);
      }
    };

    const handleTouchStart = (event) => {
      touchStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event) => {
      const deltaY = touchStartY.current - event.touches[0].clientY;
      touchStartY.current = event.touches[0].clientY;
      setTarget(targetRef.current + deltaY * 0.0045);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [setTarget]);

  return { activePanel, scrollProgress, goToPanel };
}
