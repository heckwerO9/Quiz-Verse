import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Thumb from '../components/Thumb';
import { THEME_MAP, safeTheme } from '../themes';

const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function MyQuizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  function load() {
    api('/quizzes/mine')
      .then((data) => {
        setQuizzes(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function togglePublish(q) {
    setBusy(q.id);
    try {
      await api(`/quizzes/${q.id}/publish`, { method: 'PATCH', body: { published: !q.published } });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(q) {
    if (!window.confirm(`Delete "${q.title}"? This cannot be undone.`)) return;
    setBusy(q.id);
    try {
      await api(`/quizzes/${q.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  if (!user) return <Navigate to="/login" replace />;

  const publishedCount = quizzes ? quizzes.filter((q) => q.published).length : 0;
  const draftCount = quizzes ? quizzes.length - publishedCount : 0;

  return (
    <div className="qv-my-quizzes-page">
      <header className="qv-page-hero">
        <div className="qv-page-hero-copy">
          <p className="qv-page-eyebrow">Your collection</p>
          <h1 className="qv-page-title">My Quizzes.</h1>
          <p className="qv-page-lede">Create, publish and manage everything you have written.</p>
          {quizzes && (
            <ul className="qv-page-meta">
              <li>
                <strong>{quizzes.length}</strong> total
              </li>
              <li>
                <strong>{publishedCount}</strong> published
              </li>
              <li>
                <strong>{draftCount}</strong> draft{draftCount === 1 ? '' : 's'}
              </li>
            </ul>
          )}
        </div>
        <div className="quick-actions">
          <Link to="/create" className="btn btn-primary">+ Create Quiz</Link>
          <Link to="/quizzes" className="btn btn-ghost">Explore Quizzes</Link>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {quizzes === null && !error && <div className="empty-state qv-loading">Loading your quizzes…</div>}

      {quizzes && quizzes.length === 0 && (
        <div className="empty-state qvm-empty">
          <div className="qvm-empty-art" aria-hidden="true" />
          <p>
            <strong>You haven't created any quizzes yet.</strong>
          </p>
          <p>Pick a theme, add a few questions and share it with everyone.</p>
          <Link to="/create" className="btn btn-primary">Create your first quiz</Link>
        </div>
      )}

      {quizzes && quizzes.length > 0 && (
        <div className="myquiz-list">
          {quizzes.map((q) => {
            const theme = THEME_MAP[safeTheme(q.theme)];
            return (
              <article className="card myquiz-row" key={q.id} style={{ '--accent': theme.accent }}>
                <div className="myquiz-thumb">
                  <Thumb src={q.coverImage} alt={q.title} />
                </div>
                <div className="myquiz-info">
                  <div className="myquiz-title-row">
                    <h3>{q.title}</h3>
                    <span className={`badge badge-${q.difficulty}`}>{LABELS[q.difficulty]}</span>
                    <span className={`status-pill ${q.published ? 'status-pub' : 'status-draft'}`}>
                      {q.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {q.description && <p className="muted myquiz-desc">{q.description}</p>}
                  <p className="myquiz-meta">
                    <span className="myquiz-theme">
                      <span className="myquiz-theme-dot" aria-hidden="true" />
                      {theme.name}
                    </span>
                    <span className="muted">
                      {q.questionCount} question{q.questionCount === 1 ? '' : 's'} · {q.attempts} attempt{q.attempts === 1 ? '' : 's'}
                      {q.avgScore !== null ? ` · avg score ${q.avgScore}%` : ''}
                    </span>
                  </p>
                </div>
                <div className="myquiz-actions">
                  <Link to={`/edit/${q.id}`} className="btn btn-outline btn-sm">Edit</Link>
                  <Link to={`/quiz/${q.id}`} className="btn btn-outline btn-sm">Preview</Link>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => togglePublish(q)}
                    disabled={busy === q.id}
                  >
                    {q.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(q)}
                    disabled={busy === q.id}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
