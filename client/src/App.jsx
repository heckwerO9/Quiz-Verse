import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Quizzes from './pages/Quizzes';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import QuizDetail from './pages/QuizDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyQuizzes from './pages/MyQuizzes';

function BrandIcon() {
  return (
    <svg className="brand-icon" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <defs>
        <linearGradient id="qvBrand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#qvBrand)" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.2" fill="#fff" />
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="5"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.1"
        transform="rotate(-28 16 16)"
      />
    </svg>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isExplore = location.pathname === '/quizzes';
  const isDashboard = location.pathname === '/dashboard';
  const isMyQuizzes = location.pathname === '/my-quizzes';
  const isProfile = location.pathname === '/profile';
  // Only the quiz detail (`/quiz/:id`) and quiz taking (`/quiz/:id/take`)
  // routes start with `/quiz/` — `/quizzes` (Explore) is a separate page.
  const isQuizExperience = location.pathname.startsWith('/quiz/');
  // The dark QuizVerse shell is shared by the homepage, Explore, Dashboard,
  // My Quizzes, Profile and the quiz experience (exact matches, plus the
  // `/quiz/` prefix — auth/create/edit routes keep the light shell).
  const darkShell = isHome || isExplore || isDashboard || isMyQuizzes || isProfile || isQuizExperience;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <div className={`app ${isHome ? 'app--home' : ''}`}>
      <nav className={`navbar ${darkShell ? 'navbar--dark' : ''} ${menuOpen ? 'nav-open' : ''}`}>
        <Link to="/" className="brand" aria-label="QuizVerse home">
          <BrandIcon />
          <span className="qv-brand-name">
            Quiz<em>Verse</em>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nav-toggle-bar" aria-hidden="true" />
          <span className="nav-toggle-bar" aria-hidden="true" />
          <span className="nav-toggle-bar" aria-hidden="true" />
        </button>

        <div className="nav-links" id="primary-nav">
          <NavLink to="/quizzes" className={linkClass} end={false}>
            Explore
          </NavLink>
          <NavLink to="/create" className={linkClass}>
            Create Quiz
          </NavLink>
          {user ? (
            <>
              <NavLink to="/my-quizzes" className={linkClass}>
                My Quizzes
              </NavLink>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                {user.name.split(' ')[0]}
              </NavLink>
              <button className="btn btn-outline btn-sm nav-cta" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm nav-cta">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/create" element={<CreateQuiz />} />
          <Route path="/edit/:id" element={<CreateQuiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-quizzes" element={<MyQuizzes />} />
          <Route path="/quiz/:id" element={<QuizDetail />} />
          <Route path="/quiz/:id/take" element={<TakeQuiz />} />
          <Route path="*" element={<div className="empty-state">Page not found.</div>} />
        </Routes>
      </main>

      <footer className={`footer ${darkShell ? 'footer--dark' : ''}`}>
        <div className="qv-footer">
          <div className="qv-footer-brand">
            <BrandIcon />
            <div>
              <p className="qv-footer-name">
                Quiz<em>Verse</em>
              </p>
              <p className="qv-footer-tag">Enter the world of what you know.</p>
            </div>
          </div>

          <nav className="qv-footer-links" aria-label="Footer">
            <Link to="/quizzes">Explore Quizzes</Link>
            <Link to="/create">Create Quiz</Link>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/my-quizzes">My Quizzes</Link>
                <Link to="/profile">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Sign up</Link>
              </>
            )}
          </nav>
        </div>
        <p className="footer-sub">
          Online Quiz Maker · Built for learning · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
