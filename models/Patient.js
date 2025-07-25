const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  
  // Hospital Context 
  hospital: {
    type: String,
    required: true,
    default: 'dsgh1',
    index: true // For faster querying
  },
  // Basic Patient Info 
  regNo: { type: String, required: true },
  rank: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  
  // Operation Details 
  operation: {
    date: { type: Date, required: true },       // Scheduled operation date+time
    type: { type: String, required: true },     // operationType renamed
    diagnosis: { type: String, required: true },
    indication: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'postponed', 'cancelled', 'completed'],
      default: 'scheduled'
    },
    postponedDate: Date,                        // Only if status=postponed
    priority: {
      type: String,
      enum: ['emergency', 'urgent', 'routine'],
      required: true
    },
    otType: {
      type: String,
      enum: ['Main', 'Modular'],
      default: 'Main'
    },
    anesthesia: {
      type: String,
      enum: ['ga', 'gaEpi', 'gaCaudal', 'shortGa', 'tiva', 'sab', 'cse', 'caudal', 'bb', 'bbSab', 'local', 'sedation'],
      required: true
    }
  },

  // Surgical Team 
  surgeon: { type: String, required: true },
  assistant: { type: String },
  anaesthetist: { type: String, required: true },
  nurse: { type: String, required: true },

  // Pre-op Assessment 
  lastMeal: { type: Date, required: false },
  localTest: { type: String },
  hb: { type: String },
  btct: { type: String },
  hiv: { type: Boolean, default: false },
  hcv: { type: Boolean, default: false },
  hbsag: { type: Boolean, default: false },

  // System Fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, { versionKey: false });

// Auto-filter by hospital in all queries
patientSchema.pre(/^find/, function(next) {
  this.where({ hospital: this._conditions.hospital || 'dsgh1' });
  next();
});

module.exports = mongoose.model('Patient', patientSchema);