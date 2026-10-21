import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { api, uploadImage } from '../api';
import { useAuth } from '../auth';
import Thumb from '../components/Thumb';
import { THEMES, safeTheme, suggestTheme } from '../themes';

const emptyAnswer = () => ({ text: '', isCorrect: false });
const emptyQuestion = () => ({ text: '', answers: [emptyAnswer(), { ...emptyAnswer() }] });
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE = 2 * 1024 * 1024;

export default function CreateQuiz() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('classic');
  const [suggestion, setSuggestion] = useState(null);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [coverImage, setCoverImage] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const previewRef = useRef('');

  useEffect(() => {
    if (!editing) return;
    api(`/quizzes/${id}/full`)
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
        setDifficulty(data.difficulty);
        setTheme(safeTheme(data.theme));
        setCoverImage(data.coverImage);
        setQuestions(
          data.questions.map((q) => ({
            text: q.text,
            answers: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect }))
          }))
        );
      })
      .catch((err) => setLoadError(err.message));
  }, [id, editing]);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  function pickImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Cover image must be a PNG, JPEG, GIF or WebP file');
      return;
    }
    if (file.size > MAX_IMAGE) {
      setError('Cover image must be 2MB or smaller');
      return;
    }
    setError('');
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreviewUrl(url);
    setCoverFile(file);
  }

  function removeCover() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = '';
    setPreviewUrl('');
    setCoverFile(null);
    setCoverImage('');
  }

  function suggestFromTopic() {
    const found = suggestTheme(`${title} ${description}`);
    setSuggestion(found && found !== theme ? found : null);
  }

  function applySuggestion() {
    if (suggestion) setTheme(suggestion);
    setSuggestion(null);
  }

  function updateQuestion(qi, patch) {
    setQuestions(questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }

  function updateAnswer(qi, ai, patch) {
    setQuestions(
      questions.map((q, i) =>
        i === qi
          ? { ...q, answers: q.answers.map((a, j) => (j === ai ? { ...a, ...patch } : a)) }
          : q
      )
    );
  }

  function setCorrect(qi, ai) {
    setQuestions(
      questions.map((q, i) =>
        i === qi
          ? { ...q, answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === ai })) }
          : q
      )
    );
  }

  function addQuestion() {
    setQuestions([...questions, emptyQuestion()]);
  }

  function removeQuestion(qi) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== qi));
  }

  function addAnswer(qi) {
    if (questions[qi].answers.length >= 6) return;
    updateQuestion(qi, { answers: [...questions[qi].answers, emptyAnswer()] });
  }

  function removeAnswer(qi, ai) {
    const answers = questions[qi].answers;
    if (answers.length <= 2) return;
    const next = answers.filter((_, j) => j !== ai);
    updateQuestion(qi, { answers: next });
    if (!next.some((a) => a.isCorrect)) setCorrect(qi, 0);
  }

  function validate() {
    if (!title.trim()) return 'Quiz title is required';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: question statement is required`;
      if (q.answers.length < 2) return `Question ${i + 1}: needs at least 2 answer options`;
      if (!q.answers.some((a) => a.isCorrect)) {
        return `Question ${i + 1}: select the correct answer`;
      }
      if (q.answers.some((a) => !a.text.trim())) {
        return `Question ${i + 1}: answer options cannot be empty`;
      }
    }
    return null;
  }

  async function handleSubmit(e, publish) {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      let cover = coverImage;
      if (coverFile) {
        try {
          cover = await uploadImage(coverFile);
        } catch (upErr) {
          throw new Error(`Image upload failed: ${upErr.message}`);
        }
      }
      const body = { title, description, difficulty, theme, coverImage: cover, questions };
      if (!editing) body.published = publish;
      const data = editing
        ? await api(`/quizzes/${id}`, { method: 'PUT', body })
        : await api('/quizzes', { method: 'POST', body });
      navigate(editing ? '/my-quizzes' : `/quiz/${data.id}`);
    } catch (e2) {
      setError(e2.message);
      setLoading(false);
    }
  }

  if (loadError) return <div className="alert alert-error">{loadError}</div>;

  return (
    <div className="section narrow">
      <h1>{editing ? 'Edit Quiz' : 'Create a Quiz'}</h1>
      <p className="muted">
        {editing
          ? 'Update your quiz details, questions, difficulty and cover image.'
          : 'Add your questions, pick a difficulty, and publish or save as a draft.'}
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      <form className="create-form" onSubmit={(e) => handleSubmit(e, true)}>
        <div className="card">
          <label>
            Quiz title *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JavaScript Basics"
            />
          </label>
          <label>
            Short description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this quiz about?"
              rows={2}
            />
          </label>

          <div className="field-block">
            <span className="field-label">Difficulty *</span>
            <div className="segmented" role="group" aria-label="Quiz difficulty">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`seg seg-${d.value} ${difficulty === d.value ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.value)}
                  aria-pressed={difficulty === d.value}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <div className="theme-block-head">
              <span className="field-label">Quiz Theme</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={suggestFromTopic}>
                ✨ Suggest theme from topic
              </button>
            </div>
            {suggestion && (
              <div className="alert alert-info suggestion-bar">
                <span>
                  Based on your title/description, we suggest{' '}
                  <strong>{THEMES.find((t) => t.id === suggestion)?.name}</strong>.
                </span>
                <span className="suggestion-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={applySuggestion}>
                    Apply
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSuggestion(null)}
                  >
                    Dismiss
                  </button>
                </span>
              </div>
            )}
            <div className="theme-grid" role="radiogroup" aria-label="Quiz theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={theme === t.id}
                  className={`theme-card ${theme === t.id ? 'selected' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <span className="theme-swatch" style={{ background: t.swatch }} aria-hidden="true">
                    {theme === t.id && <span className="theme-check">✓</span>}
                  </span>
                  <span className="theme-card-name">{t.name}</span>
                  <span className="theme-card-desc">{t.description}</span>
                </button>
              ))}
            </div>

            <span className="field-label theme-preview-label">Live preview</span>
            <div className={`quiz-theme theme-preview theme-${theme}`} aria-hidden="true">
              <div className="tp-topbar">
                <div className="tp-title">{title.trim() || 'Your quiz title'}</div>
                <div className="tp-progress">
                  <div className="tp-progress-label">Question 2 of 5</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
              <div className="card tp-question">
                <h3 className="tp-q-text">A sample question will look like this.</h3>
                <div className="options">
                  <div className="option selected">
                    <span className="option-letter">A</span>
                    <span className="option-text">Selected answer option</span>
                  </div>
                  <div className="option">
                    <span className="option-letter">B</span>
                    <span className="option-text">Another answer option</span>
                  </div>
                </div>
              </div>
              <div className="tp-nav">
                <span className="btn btn-outline">← Previous</span>
                <span className="btn btn-primary">Next →</span>
              </div>
            </div>
            <p className="hint">The theme is applied when anyone takes this quiz. Independent of the cover image.</p>
          </div>

          <div className="field-block">
            <span className="field-label">Cover image (optional)</span>
            <div className="cover-row">
              <div className="cover-preview">
                <Thumb
                  src={coverFile ? previewUrl : coverImage}
                  alt={title || 'Quiz cover preview'}
                />
              </div>
              <div className="cover-actions">
                <label className="btn btn-outline btn-sm cover-btn">
                  {coverFile || coverImage ? 'Change image' : 'Choose image'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={pickImage}
                    hidden
                  />
                </label>
                {(coverFile || coverImage) && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={removeCover}>
                    Remove image
                  </button>
                )}
                <p className="hint">PNG, JPEG, GIF or WebP · max 2MB · preview shown before saving</p>
              </div>
            </div>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div className="card question-card" key={qi}>
            <div className="question-head">
              <h3>Question {qi + 1}</h3>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeQuestion(qi)}
                >
                  Remove
                </button>
              )}
            </div>
            <label>
              Question *
              <input
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                placeholder="Type your question"
              />
            </label>
            <p className="hint">Select the radio button next to the correct answer.</p>
            {q.answers.map((a, ai) => (
              <div className="answer-row" key={ai}>
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={a.isCorrect}
                  onChange={() => setCorrect(qi, ai)}
                  title="Mark as correct"
                />
                <input
                  value={a.text}
                  onChange={(e) => updateAnswer(qi, ai, { text: e.target.value })}
                  placeholder={`Answer option ${ai + 1}`}
                />
                {q.answers.length > 2 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeAnswer(qi, ai)}
                    title="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {q.answers.length < 6 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addAnswer(qi)}>
                + Add option
              </button>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={addQuestion}>
            + Add Question
          </button>
          {editing ? (
            <button className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <div className="publish-group">
              <button
                type="button"
                className="btn btn-outline"
                disabled={loading}
                onClick={(e) => handleSubmit(e, false)}
              >
                Save as Draft
              </button>
              <button className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Publishing…' : 'Publish Quiz'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
