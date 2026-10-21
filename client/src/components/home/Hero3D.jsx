import { useEffect, useRef, useState } from 'react';

/**
 * Golden Knowledge Portal — a luminous, three-dimensional portal/orb
 * with orbital rings, floating particles, and elegant golden linework.
 * Purely decorative — every layer is aria-hidden and pointer-events: none.
 */
export default function Hero3D() {
  const ref = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduceMotion(reduce);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    const onMove = (event) => {
      const r = el.getBoundingClientRect();
      const x = ((event.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((event.clientY - r.top) / r.height - 0.5) * 2;
      el.style.setProperty('--qx', x.toFixed(3));
      el.style.setProperty('--qy', y.toFixed(3));
    };
    const onLeave = () => {
      el.style.setProperty('--qx', '0');
      el.style.setProperty('--qy', '0');
    };

    const host = el.parentElement || el;
    host.addEventListener('mousemove', onMove);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, [reduceMotion]);

  return (
    <div className="qv-stage" ref={ref} aria-hidden="true" data-reduce={reduceMotion ? '1' : '0'}>
      <div className="qv-stage-inner">
        {/* Ambient golden glow behind the portal */}
        <span className="qv-portal-aura" />

        {/* Elegant golden linework — arcs and orbital paths */}
        <svg className="qv-linework" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          {/* Upper arc — primary golden arc curving above the portal */}
          <path
            className="qv-line-arc qv-line-arc-primary"
            d="M0.15,0.25 Q0.5,0.05 0.85,0.25"
            stroke="currentColor"
            strokeWidth="0.002"
            fill="none"
            strokeLinecap="round"
          />
          {/* Secondary arc — thinner, wider */}
          <path
            className="qv-line-arc qv-line-arc-secondary"
            d="M0.1,0.35 Q0.5,0.18 0.9,0.35"
            stroke="currentColor"
            strokeWidth="0.0012"
            fill="none"
            strokeLinecap="round"
          />
          {/* Lower subtle arc */}
          <path
            className="qv-line-arc qv-line-arc-tertiary"
            d="M0.2,0.7 Q0.5,0.55 0.8,0.7"
            stroke="currentColor"
            strokeWidth="0.001"
            fill="none"
            strokeLinecap="round"
          />
          {/* Orbital ellipse paths */}
          <ellipse
            className="qv-line-orbit qv-line-orbit-1"
            cx="0.5"
            cy="0.5"
            rx="0.42"
            ry="0.18"
            stroke="currentColor"
            strokeWidth="0.001"
            fill="none"
          />
          <ellipse
            className="qv-line-orbit qv-line-orbit-2"
            cx="0.5"
            cy="0.5"
            rx="0.32"
            ry="0.12"
            stroke="currentColor"
            strokeWidth="0.0008"
            fill="none"
          />
          <ellipse
            className="qv-line-orbit qv-line-orbit-3"
            cx="0.5"
            cy="0.5"
            rx="0.22"
            ry="0.08"
            stroke="currentColor"
            strokeWidth="0.0006"
            fill="none"
          />
          {/* Luminous nodes at intersections */}
          <circle className="qv-line-node" cx="0.5" cy="0.22" r="0.004" />
          <circle className="qv-line-node" cx="0.28" cy="0.5" r="0.0035" />
          <circle className="qv-line-node" cx="0.72" cy="0.5" r="0.0035" />
          <circle className="qv-line-node" cx="0.5" cy="0.78" r="0.003" />
        </svg>

        {/* Concentric orbital rings (thin, elegant) */}
        <span className="qv-ring-wrap qv-ring-1">
          <span className="qv-ring" />
        </span>
        <span className="qv-ring-wrap qv-ring-2">
          <span className="qv-ring" />
        </span>
        <span className="qv-ring-wrap qv-ring-3">
          <span className="qv-ring" />
        </span>

        {/* Central luminous portal/orb */}
        <span className="qv-portal">
          <span className="qv-portal-core" />
          <span className="qv-portal-shine" />
          <span className="qv-portal-halo" />
        </span>

        {/* Floating particles */}
        <span className="qv-particles" aria-hidden="true">
          {[...Array(24)].map((_, i) => (
            <span key={i} className="qv-particle" style={{ '--i': i }} />
          ))}
        </span>
      </div>
    </div>
  );
}