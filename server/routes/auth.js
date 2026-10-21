const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const { auth } = require('../middleware/auth');

const router = express.Router();

function sign(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'quizmakersecret', {
    expiresIn: '7d'
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });
    res.status(201).json({ token: sign(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/stats — authenticated user's own statistics (ownership enforced)
router.get('/stats', auth, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const [totals, unique, byDiff, recent, quizzes] = await Promise.all([
      Attempt.aggregate([
        { $match: { user: uid } },
        {
          $group: {
            _id: null,
            attempts: { $sum: 1 },
            percentageSum: { $sum: '$percentage' },
            highest: { $max: '$percentage' },
            questions: { $sum: '$total' },
            correct: { $sum: '$score' }
          }
        }
      ]),
      Attempt.aggregate([
        { $match: { user: uid } },
        { $group: { _id: '$quiz' } },
        { $count: 'n' }
      ]),
      Attempt.aggregate([
        { $match: { user: uid } },
        {
          $group: {
            _id: '$difficulty',
            attempts: { $sum: 1 },
            questions: { $sum: '$total' },
            correct: { $sum: '$score' }
          }
        }
      ]),
      Attempt.find({ user: uid })
        .sort('-createdAt')
        .limit(8)
        .select('quizTitle difficulty score total percentage createdAt'),
      Quiz.find({ creator: uid }).select('published')
    ]);

    const t = totals[0] || null;
    const attempts = t ? t.attempts : 0;
    const questions = t ? t.questions : 0;
    const correct = t ? t.correct : 0;
    const publishedCount = quizzes.filter((q) => q.published !== false).length;

    const difficulties = ['easy', 'medium', 'hard'].map((d) => {
      const row = byDiff.find((r) => r._id === d) || { attempts: 0, questions: 0, correct: 0 };
      return {
        difficulty: d,
        attempts: row.attempts,
        questions: row.questions,
        correct: row.correct,
        accuracy: row.questions ? Math.round((row.correct / row.questions) * 100) : 0
      };
    });

    res.json({
      uniqueQuizzes: unique[0]?.n || 0,
      attempts,
      avgScore: attempts ? Math.round(t.percentageSum / attempts) : 0,
      highestScore: t ? t.highest : 0,
      questionsAnswered: questions,
      correctAnswers: correct,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      quizzesCreated: quizzes.length,
      publishedQuizzes: publishedCount,
      draftQuizzes: quizzes.length - publishedCount,
      difficulties,
      recent: recent.map((r) => ({
        quizId: r.quiz,
        quizTitle: r.quizTitle,
        difficulty: r.difficulty,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        date: r.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user.toSafeJSON());
});

module.exports = router;
