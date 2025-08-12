const mongoose = require('mongoose');
require('dotenv').config(); // <-- Load variables from .env

const connectDB = async () => {
  try {
    const uri = process.env.ATLAS_URI;

    if (!uri) {
      throw new Error('MONGODB_URI not defined in .env');
    }

    await mongoose.connect(uri, {
      serverApi: { version: '1', strict: true, deprecationErrors: true }
    });

    console.log('✅ Connected to MongoDB via ' + uri);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
