import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Thumb from '../components/Thumb';
import { THEME_MAP, safeTheme } from '../themes';

const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function QuizDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api(`/quizzes/${id}`)
      .then((data) => {
        setQuiz(data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty-state">Loading quiz…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!quiz) return <div className="empty-state">Quiz not found.</div>;

  const theme = THEME_MAP[safeTheme(quiz.theme)];

  return (
    <div className={`qv-quiz-intro quiz-theme theme-${safeTheme(quiz.theme)}`}>
      <div className="qv-intro-inner">
        <Link to="/quizzes" className="qv-quiz-back">
          ← Explore quizzes
        </Link>

        <div className="card detail-hero">
          <Thumb src={quiz.coverImage} alt={quiz.title} />
          <div className="detail-body">
            <div className="detail-badges">
              <span className={`badge badge-${quiz.difficulty}`}>{LABELS[quiz.difficulty]}</span>
              <span className="badge badge-neutral">
                <span
                  className="theme-dot"
                  style={{ background: theme.accent }}
                  aria-hidden="true"
                />
                {theme.name}
              </span>
              {!quiz.published && <span className="status-pill status-draft">Draft</span>}
              <span className="badge badge-neutral">{quiz.attempts} attempts</span>
            </div>
            <h1>{quiz.title}</h1>
            <p className="detail-desc">{quiz.description || 'No description provided.'}</p>
            <div className="detail-facts">
              <div className="fact">
                <span className="fact-num">{quiz.creator}</span>
                <span className="fact-label">Creator</span>
              </div>
              <div className="fact">
                <span className="fact-num">{quiz.questionCount}</span>
                <span className="fact-label">Questions</span>
              </div>
              <div className="fact">
                <span className="fact-num">{quiz.marks}</span>
                <span className="fact-label">Total Marks</span>
              </div>
              <div className="fact">
                <span className="fact-num">{quiz.attempts}</span>
                <span className="fact-label">Attempts</span>
              </div>
            </div>
            {quiz.isOwner && !quiz.published && (
              <div className="alert alert-info">
                This is your draft — it stays private until you publish it from{' '}
                <Link to="/my-quizzes">My Quizzes</Link>.
              </div>
            )}
            <div className="detail-actions">
              <Link to={`/quiz/${quiz.id}/take`} className="btn btn-primary btn-lg">
                Start Quiz
              </Link>
              <Link to="/quizzes" className="btn btn-outline">
                Back to Quizzes
              </Link>
            </div>
          </div>
        </div>

        {user && !quiz.isOwner && (
          <p className="muted center-note">
            Your score will be saved to <Link to="/profile">your profile</Link> after you submit.
          </p>
        )}
        {!user && (
          <p className="muted center-note">
            You can try the quiz now — <Link to="/login">log in</Link> to save your score.
          </p>
        )}
      </div>
    </div>
  );
}
