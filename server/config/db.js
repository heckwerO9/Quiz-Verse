const mongoose = require('mongoose');

// MongoDB is MANDATORY. There is no fallback or in-memory database.
// If the connection fails this function throws and the server refuses to start.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy server/.env.example to server/.env and set MONGO_URI to your MongoDB Atlas connection string.'
    );
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
}

module.exports = connectDB;
