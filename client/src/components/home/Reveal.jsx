import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight scroll-reveal wrapper.
 * Falls back to "always visible" when IntersectionObserver is missing or the
 * user prefers reduced motion, so content is never hidden by an animation.
 * Includes a timeout fallback to guarantee visibility even if the observer
 * fails to trigger (e.g., element already in view, browser quirks).
 */
export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    let timeoutId;
    let triggered = false;

    const trigger = () => {
      if (!triggered) {
        triggered = true;
        setShown(true);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trigger();
            io.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    io.observe(el);

    // Safety timeout: guarantee visibility after 2.5s even if observer
    // fails to trigger (element already in view, browser quirks, etc.)
    timeoutId = setTimeout(trigger, 2500);

    return () => {
      io.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`qv-reveal ${shown ? 'is-in' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
