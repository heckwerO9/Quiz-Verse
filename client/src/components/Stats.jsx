const LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function StatCards({ stats }) {
  if (!stats) return null;
  const items = [
    { value: stats.uniqueQuizzes, label: 'Quizzes Completed', tone: 't1' },
    { value: `${stats.avgScore}%`, label: 'Average Score', tone: 't2' },
    { value: stats.correctAnswers, label: 'Correct Answers', tone: 't3' },
    { value: stats.quizzesCreated, label: 'Quizzes Created', tone: 't4' }
  ];
  return (
    <div className="stat-cards">
      {items.map((s) => (
        <div className={`stat-card ${s.tone}`} key={s.label}>
          <span className="stat-card-num">{s.value}</span>
          <span className="stat-card-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfileStats({ stats }) {
  if (!stats) return null;
  const items = [
    { value: stats.uniqueQuizzes, label: 'Unique Quizzes Completed' },
    { value: stats.attempts, label: 'Total Attempts' },
    { value: `${stats.avgScore}%`, label: 'Average Score' },
    { value: `${stats.highestScore}%`, label: 'Highest Score' },
    { value: stats.questionsAnswered, label: 'Questions Answered' },
    { value: stats.correctAnswers, label: 'Correct Answers' },
    { value: `${stats.accuracy}%`, label: 'Overall Accuracy' },
    { value: stats.quizzesCreated, label: 'Quizzes Created' },
    { value: `${stats.publishedQuizzes} / ${stats.draftQuizzes}`, label: 'Published / Drafts' }
  ];
  return (
    <div className="profile-stats">
      {items.map((s) => (
        <div className="profile-stat" key={s.label}>
          <span className="profile-stat-num">{s.value}</span>
          <span className="profile-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DifficultyPerformance({ stats }) {
  if (!stats) return null;
  const rows = stats.difficulties || [];
  return (
    <div className="diff-grid">
      {rows.map((d) => (
        <div className={`diff-card diff-${d.difficulty}`} key={d.difficulty}>
          <div className="diff-head">
            <span className={`badge badge-${d.difficulty}`}>{LABELS[d.difficulty]}</span>
            <span className="diff-accuracy">{d.accuracy}%</span>
          </div>
          <ul className="diff-stats">
            <li>
              <span>{d.attempts}</span> attempts
            </li>
            <li>
              <span>{d.questions}</span> questions answered
            </li>
            <li>
              <span>{d.correct}</span> correct answers
            </li>
          </ul>
          <div className="mini-bar">
            <div className="mini-bar-fill" style={{ width: `${d.accuracy}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentAttempts({ stats }) {
  if (!stats) return null;
  const recent = stats.recent || [];
  if (!recent.length) {
    return <div className="empty-state compact">No quiz attempts yet — take a quiz to see it here.</div>;
  }
  return (
    <ul className="attempt-list">
      {recent.map((a, i) => (
        <li className="attempt-row" key={i}>
          <div className="attempt-main">
            <strong>{a.quizTitle}</strong>
            <span className="muted">
              {new Date(a.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <span className={`badge badge-${a.difficulty || 'medium'}`}>
            {LABELS[a.difficulty] || LABELS.medium}
          </span>
          <span className="attempt-score">
            {a.score}/{a.total}
          </span>
          <span className="pill pill-neutral">{a.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}
