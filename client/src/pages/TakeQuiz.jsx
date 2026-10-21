import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { THEME_MAP, safeTheme } from '../themes';

export default function TakeQuiz() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const attemptRef = useRef('');

  useEffect(() => {
    api(`/quizzes/${id}`)
      .then((data) => {
        setQuiz(data);
        setAnswers(Array(data.questions.length).fill(null));
        attemptRef.current =
          (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty-state">Loading quiz…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!quiz) return <div className="empty-state">Quiz not found.</div>;

  const questions = quiz.questions;
  const current = questions[index];
  const answeredCount = answers.filter(Boolean).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const isLast = index === questions.length - 1;
  const unansweredCount = questions.length - answeredCount;
  const theme = THEME_MAP[safeTheme(quiz.theme)];

  function selectAnswer(answerId) {
    const next = [...answers];
    next[index] = answerId;
    setAnswers(next);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const data = await api(`/quizzes/${id}/submit`, {
        method: 'POST',
        body: { answers, attemptKey: attemptRef.current }
      });
      setResult(data);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && result) {
    const reviewUnanswered = (result.review || []).filter((r) => !r.selectedAnswerId).length;

    return (
      <div className={`qv-results-page quiz-theme theme-${safeTheme(quiz.theme)}`}>
        <div className="qv-take-inner">
          <div className="card result-hero">
            <p className="qv-result-eyebrow">{theme.name} quiz</p>
            <h1>Quiz Complete!</h1>
            <p className="qv-result-quiz">{quiz.title}</p>
            <div className="score-ring">
              <span className="qv-score-num">{result.percentage}%</span>
              <span className="qv-score-cap">Your score</span>
            </div>
            <p className="result-msg">
              You scored <strong>{result.correct}</strong> out of <strong>{result.total}</strong>.
            </p>
            <div className="result-stats">
              <div className="stat stat-good">
                <span className="stat-num">{result.correct}</span>
                Correct
              </div>
              <div className="stat stat-bad">
                <span className="stat-num">{result.incorrect}</span>
                Incorrect
              </div>
              {reviewUnanswered > 0 && (
                <div className="stat stat-warn">
                  <span className="stat-num">{reviewUnanswered}</span>
                  Unanswered
                </div>
              )}
              <div className="stat">
                <span className="stat-num">{result.total}</span>
                Total
              </div>
            </div>
            {reviewUnanswered > 0 && (
              <p className="qv-result-note">Unanswered questions are counted as incorrect.</p>
            )}
          </div>

          <h2 className="review-title">Answer Review</h2>
          {result.review.map((r, i) => (
            <div className={`card review-card ${r.isCorrect ? 'review-good' : 'review-bad'}`} key={i}>
              <div className="review-head">
                <h3>Question {i + 1}</h3>
                <span className={`pill ${r.isCorrect ? 'pill-good' : 'pill-bad'}`}>
                  {r.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p className="review-q">{r.question}</p>
              <ul className="review-answers">
                {r.answers.map((a) => {
                  const isChosen = a.id === r.selectedAnswerId;
                  const isRight = a.id === r.correctAnswerId;
                  return (
                    <li
                      key={a.id}
                      className={`${isRight ? 'right' : ''} ${isChosen && !isRight ? 'wrong' : ''}`}
                    >
                      <span className="qv-mark" aria-hidden="true">
                        {isRight ? '✓' : isChosen ? '✗' : '·'}
                      </span>{' '}
                      {a.text}
                      {isRight && '  (correct answer)'}
                      {isChosen && !isRight && '  (your answer)'}
                    </li>
                  );
                })}
                {!r.selectedAnswerId && <li className="unanswered">· Not answered</li>}
              </ul>
            </div>
          ))}

          <div className="qv-result-actions">
            <Link to={`/quiz/${quiz.id}`} className="btn btn-primary">
              Retake Quiz
            </Link>
            <Link to="/quizzes" className="btn btn-outline">
              Browse More Quizzes
            </Link>
            <Link to="/profile" className="btn btn-outline">
              View My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`qv-take-page quiz-theme theme-${safeTheme(quiz.theme)}`}>
      <div className="qv-take-inner">
        <div className="qv-take-bar">
          <Link to={`/quiz/${quiz.id}`} className="qv-quiz-back">
            ← Exit quiz
          </Link>
          <div className="qv-take-tags">
            <span className={`badge badge-${quiz.difficulty || 'medium'}`}>
              {(quiz.difficulty || 'medium').charAt(0).toUpperCase() + (quiz.difficulty || 'medium').slice(1)}
            </span>
            <span className="badge badge-neutral">
              <span className="theme-dot" style={{ background: theme.accent }} aria-hidden="true" />
              {theme.name}
            </span>
            {!quiz.published && <span className="status-pill status-draft">Draft preview</span>}
          </div>
        </div>

        <div className="quiz-topbar">
          <div className="qv-take-head">
            <h1>{quiz.title}</h1>
            {quiz.description && <p className="muted">{quiz.description}</p>}
          </div>
          <div className="progress-wrap">
            <div className="progress-label">
              Question {index + 1} of {questions.length} · {answeredCount} answered
            </div>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Quiz progress"
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {!user && (
          <div className="alert alert-info">
            You can try this quiz, but you'll need to <Link to="/login">log in</Link> to submit and
            get your score.
          </div>
        )}
        {submitError && <div className="alert alert-error">{submitError}</div>}

        <div className="card question-card active-question">
          <p className="qv-q-label">
            Question {index + 1} of {questions.length}
          </p>
          <h2 className="q-text">{current.text}</h2>
          <div
            className="options"
            role="radiogroup"
            aria-label={`Answer choices for question ${index + 1}`}
          >
            {current.answers.map((a, i) => {
              const selected = answers[index] === a.id;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  key={a.id}
                  className={`option ${selected ? 'selected' : ''}`}
                  onClick={() => selectAnswer(a.id)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="option-text">{a.text}</span>
                  <span className="qv-option-check" aria-hidden="true">
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isLast && unansweredCount > 0 && (
          <p className="qv-unanswered-note">
            {unansweredCount} unanswered — unanswered questions are marked incorrect.
          </p>
        )}

        <div className="quiz-nav">
          <button
            className="btn btn-outline"
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
          >
            ← Previous
          </button>
          {isLast ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting || !user}
              title={!user ? 'Log in to submit' : undefined}
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIndex(index + 1)}>
              Next →
            </button>
          )}
        </div>

        <div className="question-dots">
          {questions.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'current' : ''} ${answers[i] ? 'filled' : ''}`}
              onClick={() => setIndex(i)}
              title={`Go to question ${i + 1}`}
              aria-label={`Go to question ${i + 1}${answers[i] ? ' (answered)' : ''}`}
              aria-current={i === index ? 'step' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
