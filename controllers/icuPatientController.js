const ICU_Patient = require('../models/ICUPatient');

// Create a new ICU patient
exports.createICUPatient = async (req, res) => {
  try {
    const icuPatientData = {
      ...req.body,
      hospital: req.hospital || 'dsgh1' // Add hospital context
    };
    
    // Validate required fields
    if (!icuPatientData.admissionNo || !icuPatientData.name) {
      return res.status(400).json({ 
        message: 'Registration number and name are required' 
      });
    }

    const icuPatient = new ICU_Patient(icuPatientData);
    await icuPatient.save();
    
    res.status(201).json({
      success: true,
      data: icuPatient
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Patient with this registration number already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to create ICU patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all ICU patients (with hospital context)
exports.getAllICUPatients = async (req, res) => {
  try {
    const icuPatients = await ICU_Patient.find({ 
      hospital: req.hospital // Filter by hospital
    }).sort({ admissionDate: -1 }); // Sort by most recent
    
    res.status(200).json({
      success: true,
      count: icuPatients.length,
      data: icuPatients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ICU patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get an ICU patient by admissionNo (with hospital context)
exports.getICUPatientByadmissionNo = async (req, res) => {
  try {
    const icuPatient = await ICU_Patient.findOne({ 
      admissionNo: req.params.admissionNo,
      hospital: req.hospital // Hospital context
    });
    
    if (!icuPatient) {
      return res.status(404).json({
        success: false,
        message: 'ICU patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: icuPatient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ICU patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update an ICU patient's details
exports.updateICUPatient = async (req, res) => {
  try {
    // Filter out immutable fields
    const { _id, admissionNo, hospital, createdAt, updatedAt, ...updateData } = req.body;
    
    const icuPatient = await ICU_Patient.findOneAndUpdate(
      { 
        admissionNo: req.params.admissionNo,
        hospital: req.hospital // Hospital context
      },
      { $set: updateData }, // Use $set to update only provided fields
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    );

    if (!icuPatient) {
      return res.status(404).json({
        success: false,
        message: 'ICU patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: icuPatient
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to update ICU patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Update an ICU patient's details (partial update - PATCH)
exports.patchICUPatient = async (req, res) => {
  try {
    const { admissionNo } = req.params;

    // Fields that should NOT be updated
    const immutableFields = ['_id', 'admissionNo', 'hospital', 'createdAt', 'updatedAt'];
    const updateData = { ...req.body };

    // Remove immutable fields from update payload
    immutableFields.forEach(field => {
      delete updateData[field];
    });

    // If no data remains after removing immutable fields
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update.'
      });
    }

    // Find and update the ICU patient within the hospital context
    const icuPatient = await ICU_Patient.findOneAndUpdate(
      {
        admissionNo: admissionNo,
        hospital: req.hospital // Ensure patient belongs to the requesting hospital
      },
      { $set: updateData },
      {
        new: true, // Return updated document
        runValidators: true, // Enforce schema validation
        context: 'query'
      }
    );

    if (!icuPatient) {
      return res.status(404).json({
        success: false,
        message: 'ICU patient not found or not authorized to update'
      });
    }

    res.status(200).json({
      success: true,
      data: icuPatient
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    console.error('Error in patchICUPatient:', error); // Log for debugging

    res.status(500).json({
      success: false,
      message: 'Failed to update ICU patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Delete an ICU patient
exports.deleteICUPatient = async (req, res) => {
  try {
    const icuPatient = await ICU_Patient.findOneAndDelete({ 
      admissionNo: req.params.admissionNo,
      hospital: req.hospital // Hospital context
    });
    
    if (!icuPatient) {
      return res.status(404).json({
        success: false,
        message: 'ICU patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        admissionNo: icuPatient.admissionNo,
        name: icuPatient.name,
        message: 'ICU patient deleted successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete ICU patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};