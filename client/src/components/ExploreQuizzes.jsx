import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import QuizCard from './QuizCard';
import { THEMES, safeTheme } from '../themes';

const FILTERS = [
  { value: 'all', label: 'All Levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

export default function ExploreQuizzes({ heading = 'Explore Quizzes', cardVariant = 'default' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState('newest');
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');

  // Theme filter lives in the URL (?theme=<id>) so links from the homepage
  // theme cards land here pre-filtered. Filtering is applied client-side to
  // the list returned by the existing API — no new backend behaviour.
  const themeParam = searchParams.get('theme');
  const theme = themeParam && THEMES.some((t) => t.id === themeParam) ? themeParam : 'all';

  function pickTheme(id) {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('theme');
    else next.set('theme', id);
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (difficulty !== 'all') params.set('difficulty', difficulty);
    params.set('sort', sort);
    api(`/quizzes?${params}`)
      .then((data) => {
        setQuizzes(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [search, difficulty, sort]);

  const visible =
    quizzes === null ? null : theme === 'all' ? quizzes : quizzes.filter((q) => safeTheme(q.theme) === theme);
  const activeTheme = THEMES.find((t) => t.id === theme);
  const filtering = !!(search.trim() || difficulty !== 'all' || theme !== 'all');

  return (
    <section className="section">
      <div className="section-head">
        <h2>{heading}</h2>
      </div>

      <div className="explore-controls">
        <input
          className="search-input"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes by title…"
          aria-label="Search quizzes by title"
        />
        <div className="chip-row" role="group" aria-label="Filter by difficulty">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip ${difficulty === f.value ? 'chip-active' : ''}`}
              onClick={() => setDifficulty(f.value)}
              aria-pressed={difficulty === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort quizzes"
        >
          <option value="newest">Newest first</option>
          <option value="attempts">Most attempted</option>
        </select>
      </div>

      <div className="chip-row theme-chip-row" role="group" aria-label="Filter by theme">
        <button
          type="button"
          className={`chip ${theme === 'all' ? 'chip-active' : ''}`}
          onClick={() => pickTheme('all')}
          aria-pressed={theme === 'all'}
        >
          All Themes
        </button>
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${theme === t.id ? 'chip-active' : ''}`}
            onClick={() => pickTheme(t.id)}
            aria-pressed={theme === t.id}
          >
            <i className="chip-dot" style={{ background: t.accent }} aria-hidden="true" />
            {t.name.replace(' / ', ' / ')}
          </button>
        ))}
      </div>

      {activeTheme && (
        <p className="muted theme-filter-note">
          Showing <strong>{activeTheme.name}</strong> quizzes ·{' '}
          <button type="button" className="link-btn" onClick={() => pickTheme('all')}>
            clear theme
          </button>
        </p>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {visible === null && !error && <div className="empty-state qvx-loading">Loading quizzes…</div>}
      {visible && visible.length === 0 && (
        <div className="empty-state">
          <p>
            {filtering ? 'No quizzes match your filters.' : 'No quizzes available yet. Be the first to create one!'}
          </p>
          {theme !== 'all' && (
            <p className="muted">
              Try{' '}
              <button type="button" className="link-btn" onClick={() => pickTheme('all')}>
                viewing all themes
              </button>
              .
            </p>
          )}
        </div>
      )}
      {visible && visible.length > 0 && (
        <div className="quiz-grid">
          {visible.map((q) => (
            <QuizCard key={q.id} quiz={q} variant={cardVariant} />
          ))}
        </div>
      )}
    </section>
  );
}
