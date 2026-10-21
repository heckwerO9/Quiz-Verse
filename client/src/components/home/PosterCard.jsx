import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Thumb from '../Thumb';
import { THEME_MAP, safeTheme } from '../../themes';

const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function canTilt() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A "collectible poster" quiz card: immersive artwork, gradient overlay for
 * readability, theme-coloured glowing edge and a subtle 3D tilt on hover.
 */
export default function PosterCard({ quiz, featured = false }) {
  const ref = useRef(null);
  const active = useRef(false);
  const theme = THEME_MAP[safeTheme(quiz.theme)];

  function onEnter() {
    if (!canTilt()) return;
    active.current = true;
  }

  function onMove(event) {
    const el = ref.current;
    if (!active.current || !el) return;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width - 0.5;
    const py = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--px', px.toFixed(3));
    el.style.setProperty('--py', py.toFixed(3));
  }

  function onLeave() {
    const el = ref.current;
    active.current = false;
    if (!el) return;
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  }

  return (
    <Link
      ref={ref}
      to={`/quiz/${quiz.id}`}
      className={`qv-poster ${featured ? 'is-featured' : ''}`}
      style={{ '--accent': theme.accent }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onBlur={onLeave}
    >
      <span className="qv-poster-art">
        <Thumb src={quiz.coverImage} alt={quiz.title} />
      </span>
      <span className="qv-poster-overlay" aria-hidden="true" />
      <span className="qv-poster-body">
        <span className="qv-poster-tags">
          <span className={`badge badge-${quiz.difficulty || 'medium'}`}>
            {LABELS[quiz.difficulty] || LABELS.medium}
          </span>
          <span className="qv-theme-tag">
            <i style={{ background: theme.accent }} />
            {theme.name}
          </span>
        </span>
        <span className="qv-poster-title">{quiz.title}</span>
        <span className="qv-poster-meta">
          {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'} · {quiz.attempts || 0}{' '}
          attempt{quiz.attempts === 1 ? '' : 's'}
          {quiz.creator ? ` · by ${quiz.creator}` : ''}
        </span>
        <span className="qv-poster-cta">Open quest →</span>
      </span>
    </Link>
  );
}
