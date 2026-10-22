const mongoose = require('mongoose');

module.exports = async function connectDB() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGODB_URI and JWT_SECRET must be set (see .env.example)');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};
