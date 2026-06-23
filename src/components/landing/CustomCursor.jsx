import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // We only want the cursor on desktop
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const mouse = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let requestRef;

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Instantly move dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(calc(${mouse.x}px - 50%), calc(${mouse.y}px - 50%))`;
      }
    };

    const animateRing = () => {
      // Lerp for the ring
      ring.x += (mouse.x - ring.x) * 0.15;
      ring.y += (mouse.y - ring.y) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(calc(${ring.x}px - 50%), calc(${ring.y}px - 50%))`;
      }
      requestRef = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    requestRef = requestAnimationFrame(animateRing);

    // Hover state handling
    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.dataset.cursor === 'expand'
      ) {
        if (ringRef.current) ringRef.current.classList.add('expand');
      } else {
        if (ringRef.current) ringRef.current.classList.remove('expand');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(requestRef);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  );
}
