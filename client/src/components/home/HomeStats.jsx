import { useEffect, useMemo, useRef, useState } from 'react';

function useCountUp(target, enabled, duration = 850) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, duration]);

  return value;
}

/**
 * Compact, honest statistics strip. Every number is derived from the live
 * /api/quizzes response (published quizzes, summed attempts, unique creators).
 * Renders nothing when there is no data to show.
 */
export default function HomeStats({ quizzes }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  const stats = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return null;
    const attempts = quizzes.reduce((sum, q) => sum + (q.attempts || 0), 0);
    const creators = new Set(quizzes.map((q) => q.creator).filter(Boolean)).size;
    return { quizzes: quizzes.length, attempts, creators };
  }, [quizzes]);

  useEffect(() => {
    const el = ref.current;
    if (!el || stats === null) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stats]);

  const quizCount = useCountUp(stats ? stats.quizzes : 0, seen);
  const attemptCount = useCountUp(stats ? stats.attempts : 0, seen);
  const creatorCount = useCountUp(stats ? stats.creators : 0, seen);

  if (stats === null) return null;

  const items = [
    { label: 'Published quizzes', value: quizCount, accent: '#a78bfa' },
    { label: 'Quiz attempts', value: attemptCount, accent: '#22d3ee' },
    { label: 'Creators', value: creatorCount, accent: '#f5c451' }
  ];

  return (
    <section className="qv-section" aria-labelledby="qv-stats-heading" ref={ref}>
      <h2 id="qv-stats-heading" className="qv-visually-hidden">
        QuizVerse statistics
      </h2>
      <div className="qv-stats">
        {items.map((item) => (
          <div className="qv-stat" key={item.label} style={{ '--accent': item.accent }}>
            <span className="qv-stat-num">{item.value.toLocaleString()}</span>
            <span className="qv-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
