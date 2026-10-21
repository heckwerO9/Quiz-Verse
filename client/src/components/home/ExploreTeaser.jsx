import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import Thumb from '../Thumb';
import { THEMES, THEME_MAP, safeTheme } from '../../themes';

const DIFFICULTIES = [
  { value: 'all', label: 'All levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/**
 * "Find Your Next Challenge" — a discovery panel that reuses the existing
 * quizzes API (search + difficulty + sort) and the same client-side theme
 * filter the Explore page uses, then links through to Explore with the
 * same query string. No second filtering system, no duplicate endpoints.
 */
export default function ExploreTeaser() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [theme, setTheme] = useState('all');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      params.set('sort', 'attempts');
      api(`/quizzes?${params}`)
        .then((data) => {
          if (!alive) return;
          setResults(data);
          setError('');
        })
        .catch((err) => {
          if (alive) setError(err.message);
        });
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [search, difficulty]);

  const visible = useMemo(() => {
    if (!results) return null;
    return theme === 'all' ? results : results.filter((q) => safeTheme(q.theme) === theme);
  }, [results, theme]);

  const moreParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    if (theme !== 'all') params.set('theme', theme);
    return params.toString();
  }, [search, difficulty, theme]);

  return (
    <section className="qv-section" aria-labelledby="qv-explore-heading">
      <div className="qv-section-head">
        <div>
          <span className="qv-eyebrow">Find Your Next Challenge</span>
          <h2 id="qv-explore-heading" className="qv-h2">
            Search the whole quiz universe.
          </h2>
        </div>
      </div>

      <div className="qv-explore">
        <div className="qv-explore-filters">
          <label className="qv-search">
            <span className="qv-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes by title…"
              aria-label="Search quizzes by title"
            />
          </label>

          <div className="qv-chip-row" role="group" aria-label="Filter by difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`qv-chip ${difficulty === d.value ? 'is-active' : ''}`}
                onClick={() => setDifficulty(d.value)}
                aria-pressed={difficulty === d.value}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="qv-chip-row" role="group" aria-label="Filter by theme">
            <button
              type="button"
              className={`qv-chip ${theme === 'all' ? 'is-active' : ''}`}
              onClick={() => setTheme('all')}
              aria-pressed={theme === 'all'}
            >
              All themes
            </button>
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`qv-chip ${theme === t.id ? 'is-active' : ''}`}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                style={theme === t.id ? { '--chip-accent': t.accent } : undefined}
              >
                <i className="qv-chip-dot" style={{ background: t.accent }} aria-hidden="true" />
                {t.name.replace(' & ', ' & ').split(' / ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="qv-explore-results">
          {error && <p className="qv-results-note">{error}</p>}
          {!error && visible === null && <p className="qv-results-note">Searching…</p>}
          {!error && visible && visible.length === 0 && (
            <p className="qv-results-note">
              No quizzes match those filters yet. Try another search or create one.
            </p>
          )}
          {!error && visible && visible.length > 0 && (
            <ul className="qv-result-list">
              {visible.slice(0, 3).map((quiz) => {
                const t = THEME_MAP[safeTheme(quiz.theme)];
                return (
                  <li key={quiz.id}>
                    <Link to={`/quiz/${quiz.id}`} className="qv-result">
                      <span className="qv-result-thumb" style={{ '--accent': t.accent }}>
                        <Thumb src={quiz.coverImage} alt="" />
                      </span>
                      <span className="qv-result-main">
                        <span className="qv-result-title">{quiz.title}</span>
                        <span className="qv-result-meta">
                          {LABELS[quiz.difficulty] || 'Medium'} · {quiz.questionCount} question
                          {quiz.questionCount === 1 ? '' : 's'} · {t.name}
                        </span>
                      </span>
                      <span className="qv-result-go" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="qv-explore-actions">
            <Link to={`/quizzes${moreParams ? `?${moreParams}` : ''}`} className="qv-cta qv-cta-primary">
              View all matching quizzes
            </Link>
            <Link to="/quizzes" className="qv-cta qv-cta-ghost">
              Browse everything
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
