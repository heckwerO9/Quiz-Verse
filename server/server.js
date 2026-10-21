require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '3mb' }));

// Uploaded cover images (paths are generated server-side, never taken from input)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: 'ok', db: states[mongoose.connection.readyState] || 'unknown' });
});

// Reject API traffic with a clear error if MongoDB is unreachable.
function requireDB(req, res, next) {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database unavailable: backend cannot reach MongoDB. Check MONGO_URI, then restart the server.'
    });
  }
  next();
}

app.use('/api/auth', requireDB, require('./routes/auth'));
app.use('/api/quizzes', requireDB, require('./routes/quizzes'));
app.use('/api/uploads', requireDB, require('./routes/uploads'));

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
});

// MongoDB is mandatory: verify the connection BEFORE accepting traffic.
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('FATAL: cannot start server without MongoDB.');
    console.error(`Reason: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
