const mongoose = require('mongoose');

const THEME_IDS = ['classic', 'space', 'nature', 'tech', 'history', 'ocean', 'fantasy', 'sports'];

const answerSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  answers: {
    type: [answerSchema],
    validate: [(v) => v.length >= 2, 'Each question needs at least 2 answers']
  }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  theme: { type: String, enum: THEME_IDS, default: 'classic' },
  coverImage: { type: String, default: '' },
  published: { type: Boolean, default: true },
  questions: {
    type: [questionSchema],
    validate: [(v) => v.length >= 1, 'A quiz needs at least 1 question']
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

quizSchema.index({ creator: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
module.exports.THEME_IDS = THEME_IDS;
