import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';
import Reveal from '../components/home/Reveal';
import Hero3D from '../components/home/Hero3D';
import FeaturedQuests from '../components/home/FeaturedQuests';
import ThemeUniverse from '../components/home/ThemeUniverse';
import ExploreTeaser from '../components/home/ExploreTeaser';
import HomeStats from '../components/home/HomeStats';

export default function Home() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setError('');
    api('/quizzes')
      .then((data) => {
        if (alive) setQuizzes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setQuizzes(null);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const liveCount = quizzes ? quizzes.length : null;

  return (
    <div className="qv-home">
      <section className="qv-hero">
        <div className="qv-hero-copy">
          <span className="qv-pill">
            <i className="qv-pill-dot" aria-hidden="true" />
            {liveCount === null
              ? 'A universe of quizzes'
              : `${liveCount} quiz${liveCount === 1 ? '' : 'zes'} live right now`}
          </span>

          <h1 className="qv-h1">
            Enter the World of <em>What You Know.</em>
          </h1>

          <p className="qv-lede">
            Discover extraordinary quizzes, challenge your knowledge, and create adventures of your
            own.
          </p>

          <div className="qv-hero-actions">
            <Link to="/quizzes" className="qv-cta qv-cta-primary qv-cta-lg">
              Explore Quizzes
            </Link>
            <Link to="/create" className="qv-cta qv-cta-ghost qv-cta-lg">
              {user ? 'Create a Quiz' : 'Start Creating'}
            </Link>
          </div>

          {user && (
            <p className="qv-hero-note">
              Welcome back, <strong>{user.name.split(' ')[0]}</strong> — your{' '}
              <Link to="/dashboard">dashboard</Link> has your latest stats.
            </p>
          )}
        </div>

        <div className="qv-hero-visual">
          <Hero3D posters={quizzes || []} />
        </div>
      </section>

      <Reveal>
        <FeaturedQuests
          quizzes={quizzes}
          loading={quizzes === null && !error}
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </Reveal>

      <Reveal delay={60}>
        <ThemeUniverse />
      </Reveal>

      <Reveal delay={60}>
        <ExploreTeaser />
      </Reveal>

      <Reveal delay={60}>
        <HomeStats quizzes={quizzes || []} />
      </Reveal>
    </div>
  );
}
