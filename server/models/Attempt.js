const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizTitle: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  attemptKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

attemptSchema.index({ user: 1, createdAt: -1 });
attemptSchema.index({ user: 1, attemptKey: 1 }, { unique: true });
attemptSchema.index({ quiz: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
