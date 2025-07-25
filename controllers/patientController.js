const Patient = require('../models/Patient');

// Utility function for date handling
const getDateRange = (dateStr) => {
  const date = new Date(dateStr);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return { date, nextDay };
};

module.exports = {
  createPatient: async (req, res) => {
    try {
      const patientData = {
        ...req.body,
        hospital: req.hospital
      };
      const patient = await Patient.create(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllPatients: async (req, res) => {
    try {
      const patients = await Patient.find({ hospital: req.hospital })
        .sort({ 'operation.date': 1 });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getPatientById: async (req, res) => {
    try {
      const patient = await Patient.findOne({
        _id: req.params.id,
        hospital: req.hospital
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  updatePatient: async (req, res) => {
    try {
      const patient = await Patient.findOneAndUpdate(
        { _id: req.params.id, hospital: req.hospital },
        req.body,
        { new: true, runValidators: true }
      );
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deletePatient: async (req, res) => {
    try {
      const patient = await Patient.findOneAndDelete({
        _id: req.params.id,
        hospital: req.hospital
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json({ message: 'Patient deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getDailySchedule: async (req, res) => {
    try {
      const { date, nextDay } = getDateRange(req.params.date);
      const patients = await Patient.find({
        hospital: req.hospital,
        'operation.date': { $gte: date, $lt: nextDay }
      }).sort({ 'operation.date': 1 });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getOtPatients: async (req, res) => {
    try {
      const patients = await Patient.find({
        hospital: req.hospital,
        'operation.otType': req.params.type,
        'operation.status': 'scheduled'
      }).sort({ 'operation.date': 1 });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  updateSurgeryStatus: async (req, res) => {
    try {
      const update = { 'operation.status': req.body.status };
      if (req.body.status === 'postponed' && req.body.newDate) {
        update['operation.postponedDate'] = new Date(req.body.newDate);
      }
      const patient = await Patient.findOneAndUpdate(
        { _id: req.params.id, hospital: req.hospital },
        { $set: update },
        { new: true }
      );
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getPatientsByStatus: async (req, res) => {
    try {
      const patients = await Patient.find({
        hospital: req.hospital,
        'operation.status': req.params.status
      }).sort({ 'operation.date': 1 });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getUpcomingSurgeries: async (req, res) => {
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const patients = await Patient.find({
        hospital: req.hospital,
        'operation.date': { $gte: today, $lte: nextWeek },
        'operation.status': 'scheduled'
      }).sort({ 'operation.date': 1 });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getSurgeonList: async (req, res) => {
    try {
      const surgeons = await Patient.distinct('surgeon', {
        hospital: req.hospital
      });
      res.json(surgeons);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  getAnaesthetistList: async (req, res) => {
    try {
      const anaesthetists = await Patient.distinct('anaesthetist', {
        hospital: req.hospital
      });
      res.json(anaesthetists);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};