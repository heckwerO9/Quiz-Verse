require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');

// One-time/refreshable backfill: quizzes created before difficulty/published
// existed get safe defaults so filters and queries work on existing data.
async function migrate() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const diff = await Quiz.updateMany({ difficulty: { $exists: false } }, { $set: { difficulty: 'medium' } });
  const pub = await Quiz.updateMany({ published: { $exists: false } }, { $set: { published: true } });
  console.log(`Migration done: difficulty set on ${diff.modifiedCount}, published set on ${pub.modifiedCount}`);
  await mongoose.disconnect();
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
