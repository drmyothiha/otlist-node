const mongoose = require('mongoose');
const crypto = require('crypto');

// Password hashing config
const SALT_SIZE = 16; // bytes
const HASH_SIZE = 64; // bytes
const ITERATIONS = 100000;
const DIGEST = 'sha512';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'icu'],
    default: 'doctor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function (next) {
  console.log('pre-save hook called');
  console.log('Password value:', this.password);
  console.log('Is password modified:', this.isModified('password'));
  
  if (!this.isModified('password')) return next();

  try {
    this.salt = crypto.randomBytes(SALT_SIZE).toString('hex');
    console.log('Generated salt:', this.salt);
    this.password = crypto.pbkdf2Sync(this.password, this.salt, ITERATIONS, HASH_SIZE, DIGEST).toString('hex');
    console.log('Hashed password:', this.password);
    next();
  } catch (err) {
    console.error('Error in pre-save hook:', err);
    next(err);
  }
});

// Method to compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.salt) throw new Error('Missing salt in user document.');

  const hash = crypto.pbkdf2Sync(
    candidatePassword,
    this.salt,
    ITERATIONS,
    HASH_SIZE,
    DIGEST
  ).toString('hex');

  return this.password === hash;
};

module.exports = mongoose.model('User', userSchema);
