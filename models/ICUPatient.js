const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicationSchema = new Schema({
  drugName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  time: {
    type: Date,
    required: true
  }
}, { _id: false });

const ICUDetailsSchema = new Schema({
  admissionStatus: {
    type: String,
    enum: ['stable', 'critical', 'unstable'],
    default: 'stable'
  },
  respiratorySupport: {
    mechanicalVentilation: {
      type: Boolean,
      default: false
    },
    oxygenSaturation: {
      type: String
    }
  },
  cardiacMonitoring: {
    heartRate: {
      type: String
    },
    bloodPressure: {
      type: String
    },
    ecgStatus: {
      type: String
    }
  },
  renalMonitoring: {
    urineOutput: {
      type: String
    },
    creatinine: {
      type: String
    }
  },
  medications: [MedicationSchema],
  icuNotes: {
    type: String
  },
  nextReviewDate: {
    type: Date
  }
}, { _id: false });

const ICUPatientSchema = new Schema({
  hospital: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  admissionDate: {
    type: Date,
    required: true
  },
  icuAdmissionReason: {
    type: String,
    required: true
  },
  admittingDoctor: {
    type: String,
    required: true
  },
  nurse: {
    type: String,
    required: true
  },
  medicalHistory: [{
    type: String
  }],
  icuDetails: ICUDetailsSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('ICUPatient', ICUPatientSchema, 'icu');
