const ICU_Patient = require('../models/ICUPatient');

// Create a new ICU patient
exports.createICUPatient = async (req, res) => {
  try {
    const icuPatient = new ICU_Patient(req.body);
    await icuPatient.save();
    res.status(201).json(icuPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all ICU patients, filtered by hospital and optionally by date
exports.getAllICUPatients = async (req, res) => {
  try {
    const filter = { hospital: req.hospital };  // Always filter by hospital

    const { date, start_date, end_date } = req.query;

    if (date) {
      // Handle "today" or specific date
      const requestedDate = date === 'today' ? new Date() : new Date(date);
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter['admissionDate'] = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    } else if (start_date && end_date) {
      // Handle date range
      const start = new Date(start_date);
      const end = new Date(end_date);
      filter['admissionDate'] = { $gte: start, $lt: end };
    }

    const icuPatients = await ICU_Patient.find(filter).sort({ admissionDate: 1 });
    res.status(200).json(icuPatients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get an ICU patient by regNo
exports.getICUPatientByRegNo = async (req, res) => {
  try {
    const icuPatient = await ICU_Patient.findOne({ regNo: req.params.regNo });
    if (!icuPatient) {
      return res.status(404).json({ message: 'ICU patient not found' });
    }
    res.status(200).json(icuPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an ICU patient's details
exports.updateICUPatient = async (req, res) => {
  try {
    const icuPatient = await ICU_Patient.findOneAndUpdate(
      { regNo: req.params.regNo },
      req.body,
      { new: true, runValidators: true }
    );
    if (!icuPatient) {
      return res.status(404).json({ message: 'ICU patient not found' });
    }
    res.status(200).json(icuPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an ICU patient
exports.deleteICUPatient = async (req, res) => {
  try {
    const icuPatient = await ICU_Patient.findOneAndDelete({ regNo: req.params.regNo });
    if (!icuPatient) {
      return res.status(404).json({ message: 'ICU patient not found' });
    }
    res.status(200).json({ message: 'ICU patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
