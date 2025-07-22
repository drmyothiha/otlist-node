const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  priority: { type: String, required: true },
  otType: { type: String, required: true, enum: ['Main', 'Modular'], default: 'Main' }, // Added this line
  regNo: { type: String, required: true },
  rank: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  diagnosis: { type: String, required: true },
  indication: { type: String, required: true },
  operationType: { type: String, required: true },
  anaeType: { type: String, required: true },
  surgeon: { type: String, required: true },
  assistant: { type: String },
  anaesthetist: { type: String, required: true },
  nurse: { type: String, required: true },
  lastMeal: { type: String, required: true },
  localTest: { type: String },
  hb: { type: String },
  btct: { type: String },
  hiv: { type: Boolean, default: false },
  hcv: { type: Boolean, default: false },
  hbsag: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false }); // Removes the __v field

module.exports = mongoose.model('Patient', patientSchema);