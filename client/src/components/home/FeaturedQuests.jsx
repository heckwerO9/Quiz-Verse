import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import PosterCard from './PosterCard';

const MAX_POSTERS = 10;

export default function FeaturedQuests({ quizzes, loading, error, onRetry }) {
  const railRef = useRef(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: 0 });

  const posters = useMemo(() => {
    if (!quizzes) return null;
    return [...quizzes]
      .sort((a, b) => (b.attempts || 0) - (a.attempts || 0) || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, MAX_POSTERS);
  }, [quizzes]);

  function reduced() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function nudge(direction) {
    const el = railRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.8, 360);
    el.scrollBy({ left: direction * step, behavior: reduced() ? 'auto' : 'smooth' });
  }

  function onPointerDown(event) {
    if (event.pointerType !== 'mouse') return;
    const el = railRef.current;
    if (!el) return;
    drag.current = { down: true, startX: event.clientX, startLeft: el.scrollLeft, moved: 0 };
  }

  function onPointerMove(event) {
    const el = railRef.current;
    if (!el || !drag.current.down) return;
    const delta = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(delta));
    el.scrollLeft = drag.current.startLeft - delta;
  }

  function endDrag() {
    drag.current.down = false;
  }

  function onClickCapture(event) {
    if (drag.current.moved > 6) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = 0;
    }
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudge(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudge(-1);
    }
  }

  const showRail = posters && posters.length > 0;

  return (
    <section className="qv-section qv-featured" aria-labelledby="qv-featured-heading">
      <div className="qv-section-head">
        <div>
          <span className="qv-eyebrow">Featured Quests</span>
          <h2 id="qv-featured-heading" className="qv-h2">
            Your next obsession is one quiz away.
          </h2>
        </div>
        <div className="qv-rail-controls">
          <Link to="/quizzes" className="qv-link-more">
            View all
          </Link>
          <button
            type="button"
            className="qv-rail-btn"
            onClick={() => nudge(-1)}
            disabled={!showRail}
            aria-label="Scroll featured quizzes backwards"
          >
            ‹
          </button>
          <button
            type="button"
            className="qv-rail-btn"
            onClick={() => nudge(1)}
            disabled={!showRail}
            aria-label="Scroll featured quizzes forwards"
          >
            ›
          </button>
        </div>
      </div>

      {loading && (
        <div className="qv-rail is-loading" aria-busy="true" aria-label="Loading featured quizzes">
          {[0, 1, 2, 3].map((i) => (
            <span className="qv-skel" key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="qv-empty">
          <p>We couldn&apos;t load featured quests right now.</p>
          <p className="qv-empty-sub">{error}</p>
          {onRetry && (
            <button type="button" className="qv-cta qv-cta-ghost" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      )}

      {!loading && !error && posters && posters.length === 0 && (
        <div className="qv-empty">
          <h3>The universe is still empty.</h3>
          <p className="qv-empty-sub">
            No quizzes have been published yet. Be the first explorer to launch one.
          </p>
          <Link to="/create" className="qv-cta qv-cta-primary">
            Create the first quiz
          </Link>
        </div>
      )}

      {!loading && !error && showRail && (
        <div
          className="qv-rail"
          ref={railRef}
          tabIndex={0}
          role="group"
          aria-label="Featured quizzes carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onKeyDown={onKeyDown}
        >
          {posters.map((quiz, index) => (
            <PosterCard key={quiz.id} quiz={quiz} featured={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
