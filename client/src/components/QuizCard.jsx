import { Link } from 'react-router-dom';
import Thumb from './Thumb';
import { THEME_MAP, safeTheme } from '../themes';

const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

// variant="poster" opts into the QuizVerse cinematic card used on /quizzes.
// The default variant is byte-for-byte identical to the original card so the
// dashboard keeps its existing look.
export default function QuizCard({ quiz, variant = 'default' }) {
  const poster = variant === 'poster';
  const theme = poster ? THEME_MAP[safeTheme(quiz.theme)] : null;

  return (
    <Link
      to={`/quiz/${quiz.id}`}
      className={`quiz-card${poster ? ' quiz-card--poster' : ''}`}
      style={poster ? { '--accent': theme.accent } : undefined}
    >
      <Thumb src={quiz.coverImage} alt={quiz.title} />
      <div className="quiz-card-body">
        <div className="quiz-card-top">
          <span className={`badge badge-${quiz.difficulty || 'medium'}`}>
            {LABELS[quiz.difficulty] || LABELS.medium}
          </span>
          <span className="quiz-card-attempts">{quiz.attempts || 0} attempts</span>
        </div>
        <h3>{quiz.title}</h3>
        {quiz.description && <p className="quiz-card-desc">{quiz.description}</p>}
        {poster && (
          <span className="quiz-card-theme">
            <i style={{ background: theme.accent }} aria-hidden="true" />
            {theme.name}
          </span>
        )}
        <div className="quiz-card-meta">
          <span>By {quiz.creator}</span>
          <span>
            {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'} · {quiz.marks ?? quiz.questionCount} marks
          </span>
        </div>
        <span className="btn btn-primary btn-block">View Quiz</span>
      </div>
    </Link>
  );
}
