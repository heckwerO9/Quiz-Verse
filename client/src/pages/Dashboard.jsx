import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import ExploreQuizzes from '../components/ExploreQuizzes';
import { StatCards, DifficultyPerformance, RecentAttempts } from '../components/Stats';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/auth/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="qv-dashboard-page">
      <header className="qvd-hero">
        <div className="qvd-hero-copy">
          <p className="qvd-eyebrow">Welcome back, {user.name.split(' ')[0]} 👋</p>
          <h1 className="qvd-title">Your Quiz Universe.</h1>
          <p className="qvd-lede">Ready to learn something new today?</p>
          {stats && (
            <ul className="qvd-meta">
              <li>
                <strong>{stats.publishedQuizzes}</strong> published
              </li>
              <li>
                <strong>{stats.draftQuizzes}</strong> draft{stats.draftQuizzes === 1 ? '' : 's'}
              </li>
              <li>
                <strong>{stats.attempts}</strong> attempt{stats.attempts === 1 ? '' : 's'}
              </li>
            </ul>
          )}
        </div>
        <div className="quick-actions">
          <Link to="/create" className="btn btn-primary">Create Quiz</Link>
          <Link to="/my-quizzes" className="btn btn-ghost">My Quizzes</Link>
          <Link to="/profile" className="btn btn-ghost">My Profile</Link>
        </div>
      </header>

      <ExploreQuizzes heading="Explore Quizzes" />

      <section className="section">
        <div className="section-head">
          <h2>Your Statistics</h2>
          <Link to="/profile" className="link">Full profile →</Link>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {!stats && !error && <div className="empty-state qvd-loading">Loading your statistics…</div>}
        {stats && stats.attempts === 0 && (
          <div className="empty-state qvd-note">
            <p>Your progress will appear here after your first quiz attempt.</p>
            <Link to="/quizzes" className="btn btn-primary btn-sm">Explore quizzes</Link>
          </div>
        )}
        <StatCards stats={stats} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Recent Activity</h2>
        </div>
        <RecentAttempts stats={stats} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Performance by Difficulty</h2>
        </div>
        <DifficultyPerformance stats={stats} />
      </section>
    </div>
  );
}
