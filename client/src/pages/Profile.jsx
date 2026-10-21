import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { ProfileStats, DifficultyPerformance, RecentAttempts } from '../components/Stats';

export default function Profile() {
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
    <div className="qv-profile-page">
      <header className="qv-page-hero">
        <div className="qv-page-hero-copy">
          <p className="qv-page-eyebrow">Your account</p>
          <h1 className="qv-page-title">Your Profile.</h1>
          <p className="qv-page-lede">Your identity, progress and quiz history in one place.</p>
        </div>
      </header>

      <div className="card profile-head">
        <div className="avatar" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="profile-name">{user.name}</h2>
          <p className="muted">{user.email}</p>
        </div>
        <div className="profile-head-actions">
          <Link to="/my-quizzes" className="btn btn-outline btn-sm">My Quizzes</Link>
          <Link to="/create" className="btn btn-primary btn-sm">Create Quiz</Link>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Your Statistics</h2>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {!stats && !error && <div className="empty-state qv-loading">Loading your statistics…</div>}
        <ProfileStats stats={stats} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Performance by Difficulty</h2>
        </div>
        <DifficultyPerformance stats={stats} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Recent Attempts</h2>
        </div>
        <RecentAttempts stats={stats} />
      </section>
    </div>
  );
}
