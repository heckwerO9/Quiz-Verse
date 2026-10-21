const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const { auth } = require('../middleware/auth');

const router = express.Router();

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const THEMES = Quiz.THEME_IDS || ['classic', 'space', 'nature', 'tech', 'history', 'ocean', 'fantasy', 'sports'];
const COVER_RE = /^\/uploads\/[\w-]+\.(png|jpg|jpeg|gif|webp)$/;

function safeDifficulty(d) {
  return DIFFICULTIES.includes(d) ? d : 'medium';
}

function safeTheme(t) {
  return THEMES.includes(t) ? t : 'classic';
}

function isPublished(q) {
  return q.published !== false;
}

function validateQuizPayload(payload) {
  const { title, questions } = payload;
  if (!title || !title.trim()) return 'Quiz title is required';
  if (payload.difficulty !== undefined && payload.difficulty !== '' && !DIFFICULTIES.includes(payload.difficulty)) {
    return 'Difficulty must be easy, medium or hard';
  }
  if (payload.coverImage && !COVER_RE.test(payload.coverImage)) return 'Invalid cover image';
  if (!Array.isArray(questions) || questions.length === 0) return 'Add at least one question';
  for (const q of questions) {
    if (!q.text || !q.text.trim()) return 'Every question needs a question statement';
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      return 'Every question needs at least 2 answer options';
    }
    const correctCount = q.answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) return 'Every question must have exactly one correct answer';
    for (const a of q.answers) {
      if (!a.text || !a.text.trim()) return 'Answer options cannot be empty';
    }
  }
  return null;
}

function buildQuestions(questions) {
  return questions.map((q) => ({
    text: q.text.trim(),
    answers: q.answers.map((a) => ({ text: a.text.trim(), isCorrect: !!a.isCorrect }))
  }));
}

function deleteCover(url) {
  if (typeof url === 'string' && COVER_RE.test(url)) {
    fs.unlink(path.join(__dirname, '..', 'uploads', path.basename(url)), () => {});
  }
}

// attempt counts (and average score) per quiz, keyed by quiz id string
async function attemptStats(ids) {
  if (!ids.length) return {};
  const rows = await Attempt.aggregate([
    { $match: { quiz: { $in: ids } } },
    { $group: { _id: '$quiz', count: { $sum: 1 }, avg: { $avg: '$percentage' } } }
  ]);
  const map = {};
  rows.forEach((r) => (map[String(r._id)] = { count: r.count, avg: Math.round(r.avg) }));
  return map;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// attach req.user when a valid token is present, but never reject
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'quizmakersecret');
    } catch (err) {
      /* ignore invalid token on public reads */
    }
  }
  next();
}

// GET /api/quizzes — published quizzes (summary only, no answers)
// query: search, difficulty (easy|medium|hard), sort (newest|attempts)
router.get('/', async (req, res) => {
  try {
    const conds = [{ $or: [{ published: true }, { published: { $exists: false } }] }];
    const search = String(req.query.search || '').trim();
    if (search) conds.push({ title: { $regex: escapeRegex(search), $options: 'i' } });
    const difficulty = req.query.difficulty;
    if (DIFFICULTIES.includes(difficulty)) {
      const diffConds = [{ difficulty }];
      if (difficulty === 'medium') diffConds.push({ difficulty: { $exists: false } });
      conds.push({ $or: diffConds });
    }
    const quizzes = await Quiz.find({ $and: conds })
      .sort('-createdAt')
      .populate('creator', 'name')
      .select('title description questions creator createdAt difficulty theme coverImage published');
    const stats = await attemptStats(quizzes.map((q) => q._id));
    let items = quizzes.map((q) => {
      const st = stats[String(q._id)] || { count: 0 };
      return {
        id: q._id,
        title: q.title,
        description: q.description,
        questionCount: q.questions.length,
        marks: q.questions.length,
        creator: q.creator?.name || 'Unknown',
        createdAt: q.createdAt,
        difficulty: safeDifficulty(q.difficulty),
        theme: safeTheme(q.theme),
        coverImage: q.coverImage || '',
        published: isPublished(q),
        attempts: st.count
      };
    });
    if (req.query.sort === 'attempts') {
      items.sort(
        (a, b) => b.attempts - a.attempts || new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quizzes/mine — all of the caller's quizzes with attempt stats
router.get('/mine', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user.id }).sort('-createdAt');
    const stats = await attemptStats(quizzes.map((q) => q._id));
    res.json(
      quizzes.map((q) => {
        const st = stats[String(q._id)] || {};
        return {
          id: q._id,
          title: q.title,
          description: q.description,
          difficulty: safeDifficulty(q.difficulty),
          theme: safeTheme(q.theme),
          coverImage: q.coverImage || '',
          published: isPublished(q),
          questionCount: q.questions.length,
          createdAt: q.createdAt,
          attempts: st.count || 0,
          avgScore: st.count ? st.avg : null
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quizzes/:id/full — full quiz for editing (owner only, answers included)
router.get('/:id/full', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (String(quiz.creator) !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own quizzes' });
    }
    res.json({
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      difficulty: safeDifficulty(quiz.difficulty),
      theme: safeTheme(quiz.theme),
      coverImage: quiz.coverImage || '',
      published: isPublished(quiz),
      questions: quiz.questions.map((q) => ({
        id: q._id,
        text: q.text,
        answers: q.answers.map((a) => ({ id: a._id, text: a.text, isCorrect: a.isCorrect }))
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/quizzes/:id — detail + questions for taking (answers stripped).
// Unpublished quizzes are visible only to their creator.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('creator', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const isOwner = !!(req.user && String(quiz.creator?._id || quiz.creator) === req.user.id);
    if (!isPublished(quiz) && !isOwner) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    const stats = await attemptStats([quiz._id]);
    const st = stats[String(quiz._id)] || { count: 0 };
    res.json({
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      creator: quiz.creator?.name || 'Unknown',
      creatorId: String(quiz.creator?._id || quiz.creator),
      difficulty: safeDifficulty(quiz.difficulty),
      theme: safeTheme(quiz.theme),
      coverImage: quiz.coverImage || '',
      published: isPublished(quiz),
      isOwner,
      questionCount: quiz.questions.length,
      marks: quiz.questions.length,
      attempts: st.count,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        text: q.text,
        answers: q.answers.map((a) => ({ id: a._id, text: a.text }))
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quizzes — create (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const error = validateQuizPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    const quiz = await Quiz.create({
      title: req.body.title.trim(),
      description: (req.body.description || '').trim(),
      difficulty: safeDifficulty(req.body.difficulty),
      theme: safeTheme(req.body.theme),
      coverImage: req.body.coverImage || '',
      published: req.body.published !== false,
      questions: buildQuestions(req.body.questions),
      creator: req.user.id
    });
    res.status(201).json({ id: quiz._id, message: isPublished(quiz) ? 'Quiz published successfully' : 'Draft saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/quizzes/:id — edit (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (String(quiz.creator) !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own quizzes' });
    }
    const error = validateQuizPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    if (req.body.coverImage !== undefined && req.body.coverImage !== quiz.coverImage) {
      deleteCover(quiz.coverImage);
    }
    quiz.title = req.body.title.trim();
    quiz.description = (req.body.description || '').trim();
    quiz.difficulty = safeDifficulty(req.body.difficulty);
    if (req.body.theme !== undefined) quiz.theme = safeTheme(req.body.theme);
    if (req.body.coverImage !== undefined) quiz.coverImage = req.body.coverImage || '';
    quiz.questions = buildQuestions(req.body.questions);
    await quiz.save();
    res.json({ id: quiz._id, message: 'Quiz updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/quizzes/:id/publish — publish or unpublish (owner only)
router.patch('/:id/publish', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (String(quiz.creator) !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own quizzes' });
    }
    quiz.published = req.body.published === true;
    await quiz.save();
    res.json({ id: quiz._id, published: quiz.published });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/quizzes/:id (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (String(quiz.creator) !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own quizzes' });
    }
    deleteCover(quiz.coverImage);
    await Quiz.deleteOne({ _id: quiz._id });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quizzes/:id/submit — server-side scoring + attempt saved (auth required).
// Unpublished quizzes can only be submitted by their creator.
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const isOwner = String(quiz.creator) === req.user.id;
    if (!isPublished(quiz) && !isOwner) {
      return res.status(403).json({ message: 'This quiz is not published' });
    }
    if (!quiz.questions.length) return res.status(400).json({ message: 'This quiz has no questions' });

    const selected = Array.isArray(req.body.answers) ? req.body.answers : [];
    let correct = 0;
    const review = quiz.questions.map((q, i) => {
      const selectedId = selected[i] || null;
      const chosen = q.answers.id(selectedId);
      const right = q.answers.find((a) => a.isCorrect);
      const isCorrect = !!(chosen && right && String(chosen._id) === String(right._id));
      if (isCorrect) correct += 1;
      return {
        question: q.text,
        answers: q.answers.map((a) => ({ id: a._id, text: a.text })),
        correctAnswerId: right?._id || null,
        selectedAnswerId: chosen?._id || null,
        isCorrect
      };
    });

    const total = quiz.questions.length;
    const percentage = Math.round((correct / total) * 100);

    const attemptKey =
      typeof req.body.attemptKey === 'string' && req.body.attemptKey.length >= 4 && req.body.attemptKey.length <= 64
        ? req.body.attemptKey
        : crypto.randomUUID();
    try {
      await Attempt.create({
        user: req.user.id,
        quiz: quiz._id,
        quizTitle: quiz.title,
        difficulty: safeDifficulty(quiz.difficulty),
        score: correct,
        total,
        percentage,
        attemptKey
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // duplicate attemptKey → already saved, ignore
    }

    res.json({
      total,
      correct,
      incorrect: total - correct,
      score: correct,
      percentage,
      review
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
