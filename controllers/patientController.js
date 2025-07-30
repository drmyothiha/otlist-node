const Patient = require('../models/OTPatient');

// Utility function for date handling
// const getDateRange = (dateStr) => {
//   const date = new Date(dateStr);
//   const nextDay = new Date(date);
//   nextDay.setDate(nextDay.getDate() + 1);
//   return { date, nextDay };
// };

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
      const filter = { hospital: req.hospital };  // Always filter by hospital

      // Handle date filtering
      const { date, start_date, end_date } = req.query;

      if (date) {
        // Handle "today" or specific date
        const requestedDate = date === 'today' ? new Date() : new Date(date);
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        filter['operation.date'] = {
          $gte: startOfDay,
          $lt: endOfDay
        };
      } else if (start_date && end_date) {
        // Handle date range
        const start = new Date(start_date);
        const end = new Date(end_date);
        filter['operation.date'] = { $gte: start, $lt: end };
      }

      const patients = await Patient.find(filter).sort({ 'operation.date': 1 });
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
  }
};