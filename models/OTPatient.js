const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  operationId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  type: { type: String, required: true },
  diagnosis: { type: String, required: true },
  indication: { type: String, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'postponed', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  postponedDate: Date,
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
  },
  surgeon: { type: String, required: true },
  assistant: { type: String },
  anaesthetist: { type: String, required: true },
  nurse: { type: String, required: true },
  preOpAssessment: {
    lastMeal: { type: Date },
    localTest: { type: String },
    hb: { type: String },
    btct: { type: String },
    hiv: { type: Boolean, default: false },
    hcv: { type: Boolean, default: false },
    hbsag: { type: Boolean, default: false },
    assessmentDate: { type: Date },
    airwayAssessment: { type: String },
    cardiacRisk: { type: String },
    respiratoryRisk: { type: String },
    asaGrade: { type: String },
    allergies: { type: String },
    medications: { type: String },
    fastingStatus: { type: String },
    consent: { type: Boolean }
  },
  intraOpMonitoring: {
    anesthesiaStartTime: { type: Date },
    surgeryStartTime: { type: Date },
    surgeryEndTime: { type: Date },
    anesthesiaEndTime: { type: Date },
    airwayManagement: { type: String },
    monitoring: [{
      timeOffset: { type: Number },
      time: { type: Date },
      nibp: { type: String },
      spo2: { type: String },
      ecg: { type: String },
      hr: { type: Number },
      rr: { type: Number },
      temp: { type: Number }
    }],
    fluidsAdministered: [{
      type: { type: String },
      volume: { type: String },
      startTime: { type: Date },
      endTime: { type: Date }
    }],
    bloodLoss: { type: String },
    urineOutput: { type: String },
    complications: { type: String },
    medications: [{
      drug: { type: String },
      dose: { type: String },
      timeOffset: { type: Number },
      time: { type: Date },
      route: { type: String },
      purpose: { type: String }
    }]
  },
  recoveryStatus: {
    recoveryStartTime: { type: Date },
    recoveryEndTime: { type: Date },
    vitalSigns: [{
      time: { type: Date },
      bp: { type: String },
      hr: { type: Number },
      spo2: { type: String },
      painScore: { type: Number }
    }],
    consciousness: { type: String },
    painManagement: {
      medication: { type: String },
      time: { type: Date }
    },
    dischargeCriteria: {
      aldreteScore: { type: Number },
      met: { type: Boolean },
      dischargeTime: { type: Date }
    },
    complications: { type: String },
    postOpInstructions: { type: String }
  }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  // Hospital Context
  hospital: {
    type: String,
    required: true,
    default: 'dsgh1',
    index: true
  },
  // Basic Patient Info
  admissionNo: { type: String, required: true },
  name: { type: String, required: true },
  
  // Operations (array)
  operations: [operationSchema],

  // System Fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

}, 
{ 
  versionKey: false,
  strict: false  // Allows adding new fields
});

// Auto-update timestamp on save
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-filter by hospital in all queries
patientSchema.pre(/^find/, function(next) {
  this.where({ hospital: this._conditions.hospital || 'dsgh1' });
  next();
});

module.exports = mongoose.model('Patient', patientSchema, 'ot');