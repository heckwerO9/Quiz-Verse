import { Link } from 'react-router-dom';
import { THEMES } from '../../themes';

/**
 * "Choose Your Universe" — one interactive card per existing quiz theme.
 * Each card carries its own lightweight CSS illustration (.qv-th-<id>) and
 * links to the Explore page pre-filtered by that theme id.
 */
export default function ThemeUniverse() {
  return (
    <section className="qv-section" aria-labelledby="qv-themes-heading">
      <div className="qv-section-head">
        <div>
          <span className="qv-eyebrow">Choose Your Universe</span>
          <h2 id="qv-themes-heading" className="qv-h2">
            Eight worlds. One knowledge.
          </h2>
        </div>
        <Link to="/quizzes" className="qv-link-more">
          Explore all
        </Link>
      </div>

      <div className="qv-theme-grid">
        {THEMES.map((theme) => (
          <Link
            key={theme.id}
            to={`/quizzes?theme=${theme.id}`}
            className={`qv-theme-card qv-th-${theme.id}`}
            style={{ '--accent': theme.accent }}
          >
            <span className="qv-th-art" aria-hidden="true" />
            <span className="qv-th-body">
              <span className="qv-th-name">{theme.name}</span>
              <span className="qv-th-desc">{theme.description}</span>
              <span className="qv-th-link">Explore theme →</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
