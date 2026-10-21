import ExploreQuizzes from '../components/ExploreQuizzes';

export default function Quizzes() {
  return (
    <div className="qv-explore-page">
      <header className="qvx-hero">
        <p className="qvx-eyebrow">QuizVerse · Explore</p>
        <h1 className="qvx-title">The whole quiz universe.</h1>
        <p className="qvx-lede">
          Search by title, filter by theme and difficulty, then pick a quiz and start answering.
        </p>
      </header>

      <ExploreQuizzes heading="Browse Quizzes" cardVariant="poster" />
    </div>
  );
}
