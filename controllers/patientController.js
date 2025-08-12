const Patient = require('../models/OTPatient');
//operation ID လေးလုံးပဲ ထားထားသည်
const generateOperationId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000); 
  return `OP-${year}-${randomNum}`;
};
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = dob instanceof Date ? dob : new Date(dob);
  if (isNaN(birthDate)) return null;

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = today.getUTCMonth() - birthDate.getUTCMonth();

  if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age--;
  }

  return age;
}

module.exports = {
  // Patient CRUD Operations
  
  createPatient: async (req, res) => {
    try {
      // Generate unique operation IDs if needed
      const operations = req.body.operations?.map(op => ({
        ...op,
        operationId: op.operationId || generateOperationId()
      })) || [];

      const patientData = {
        ...req.body,
        operations,
        hospital: req.hospital
      };

      const patient = await Patient.create(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ 
          error: "Duplicate operation ID detected. Please provide a unique operation ID."
        });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },

// READ (All) - Get patients with filtered operation data
// Query Examples
// GET /patients?date=today
// Patients with operations today
// GET /patients?start_date=2025-04-01&end_date=2025-04-30
// GET /patients?status=scheduled
// Only scheduled
// GET /patients?date=2025-04-05&status=in_progress
// Specific day + status
// Uses UTC for dates (important for consistency)

getAllPatients: async (req, res) => {
  try {
    const { date, start_date, end_date, status } = req.query;
    const baseFilter = { hospital: req.hospital };
    const operationMatch = {};

    // Helper: Parse YYYY-MM-DD string to UTC start of day (Date object)
    const parseToUTCStartOfDay = (dateStr) => {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return null;
      return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
    };

    // 1. Handle date filtering ONLY if date params are provided
    if (date || start_date || end_date) {
      if (date && date !== 'today') {
        const parsed = parseToUTCStartOfDay(date);
        if (!parsed) {
          return res.status(400).json({ 
            error: 'Invalid date format. Use YYYY-MM-DD.' 
          });
        }
        const endOfDay = new Date(parsed);
        endOfDay.setUTCHours(24, 0, 0, 0); // End of day UTC
        operationMatch['operation.date'] = {
          $gte: parsed,
          $lt: endOfDay,
        };
      } else if (date === 'today') {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const end = new Date(start);
        end.setUTCHours(24, 0, 0, 0);

        operationMatch['operation.date'] = { $gte: start, $lt: end };
      } else {
        // Handle start_date and/or end_date
        if (start_date) {
          const parsed = parseToUTCStartOfDay(start_date);
          if (!parsed) {
            return res.status(400).json({ 
              error: 'Invalid start_date format. Use YYYY-MM-DD.' 
            });
          }
          operationMatch['operation.date'] = operationMatch['operation.date'] || {};
          operationMatch['operation.date'].$gte = parsed;
        }
        if (end_date) {
          const parsed = parseToUTCStartOfDay(end_date);
          if (!parsed) {
            return res.status(400).json({ 
              error: 'Invalid end_date format. Use YYYY-MM-DD.' 
            });
          }
          const endOfDay = new Date(parsed);
          endOfDay.setUTCHours(24, 0, 0, 0); // End of that day UTC

          operationMatch['operation.date'] = operationMatch['operation.date'] || {};
          operationMatch['operation.date'].$lt = endOfDay;
        }
      }
    }

    // 2. Add status filter only if provided
    if (status) {
      operationMatch['operation.status'] = status;
    }

    // 3. Aggregation pipeline
    const pipeline = [
      { $match: baseFilter },           // Filter by hospital
      { $unwind: '$operations' },       // Deconstruct operations array
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', { operation: '$operations' }]
          }
        }
      },
      { $project: { operations: 0 } }   // Remove original operations array
    ];

    // Only add $match if we have operation-level filters (date or status)
    if (Object.keys(operationMatch).length > 0) {
      pipeline.push({ $match: operationMatch });
    }

    // Sort by operation date (ascending)
    pipeline.push({ $sort: { 'operation.date': 1 } });

    // Run aggregation
    const patients = await Patient.aggregate(pipeline);

    // 4. Format response
    const formatted = patients.map(p => ({
      admissionNo: p.admissionNo,
      regNo: p.regNo,
      rank: p.rank,
      name: p.name,
      unit: p.unit,
      dob: calculateAge(p.dob),
      gender: p.gender,
      operations: [{
        operationId: p.operation.operationId,
        date: p.operation.date 
          ? new Date(p.operation.date).toISOString() 
          : null,
        type: p.operation.type,
        diagnosis: p.operation.diagnosis,
        indication: p.operation.indication,
        status: p.operation.status,
        priority: p.operation.priority,
        otType: p.operation.otType,
        ward: p.operation.ward,
        anesthesia: p.operation.anesthesia,
        surgeon: p.operation.surgeon,
        anaesthetist: p.operation.anaesthetist,
        nurse: p.operation.nurse,
      }]
    }));

    res.json(formatted);

  } catch (error) {
    console.error('Error in getAllPatients:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
},

// READ (Single) - Retrieve a specific patient by ID
getPatientById: async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the patient by ID
    // Using lean() for better performance since we don't need Mongoose document features
    const patient = await Patient.findById(id).lean();
    
    // 2. Handle case where patient isn't found
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 3. Return the found patient
    res.json(patient);

  } catch (error) {
    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
      // This occurs when the ID format is invalid
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    // For all other unexpected errors
    res.status(500).json({ 
      error: 'Internal server error',
      // Only show error details in development environment
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

getPatientByAdmissionNo: async (req, res) => {
  try {
    const { admissionNo } = req.params;

    // 1. Find the patient by admission number and hospital
    const patient = await Patient.findOne({
      admissionNo: admissionNo,
      hospital: req.hospital // Include hospital context for multi-tenant systems
    }).lean(); // Using lean() for better performance

    // 2. Handle case where patient isn't found
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found with the given admission number in this hospital'
      });
    }

    // 3. Return the found patient
    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    // Handle different types of errors appropriately
    console.error('Error fetching patient by admission number:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid admission number format'
      });
    }
    
    // For all other unexpected errors
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      // Only show error details in development environment
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},
  // UPDATE - Using Model.findOneAndUpdate()
  updatePatient: async (req, res) => {
  try {
    // Filter out immutable/restricted fields
    const { admissionNo, hospital, createdAt, updatedAt, ...updateData } = req.body;
    
    const patient = await Patient.findOneAndUpdate(
      { admissionNo: req.params.admissionNo, hospital: req.hospital },
      { $set: updateData },  // Critical change here
      { 
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true  // Useful for default values
      }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
},

  // DELETE - Using Model.findOneAndDelete()
deletePatient: async (req, res) => {
  try {
    const { admissionNo } = req.params; // ✅ Use admissionNo
    const patient = await Patient.findOneAndDelete({
      admissionNo: admissionNo,
      hospital: req.hospital
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
},
  // CREATE Operation - Using $push operator
  addOperation: async (req, res) => {
    try {
      const operation = {
        ...req.body,
        operationId: `OP-${Date.now()}`
      };

      const patient = await Patient.findOneAndUpdate(
        { admissionNo: req.params.admissionNo, hospital: req.hospital },
        { $push: { operations: operation } }, // Adds to operations array
        { new: true, runValidators: true }
      );

      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.status(201).json(patient.operations[patient.operations.length - 1]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // READ All Operations - Using select() to project only operations
  getAllOperations: async (req, res) => {
    try {
      const { admissionNo } = req.params;
      const patient = await Patient.findOne({
        admissionNo: admissionNo,
        hospital: req.hospital
      }).select('operations'); // Only returns operations field

      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient.operations);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  // READ Single Operation - Using array filtering in findOne()
getOperationByadmissionNo: async (req, res) => {
  try {
    const { admissionNo, operationId } = req.params;

    const patient = await Patient.findOne({
      admissionNo,
      hospital: req.hospital,
      'operations.operationId': operationId
    });

    if (!patient) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const operation = patient.operations.find(
      op => op.operationId === operationId
    );

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    // Merge patient-level fields into the operation object
    res.json({
      name: patient.name,
      admissionNo: patient.admissionNo,
      gender: patient.gender,
      dob: patient.dob,
      bloodGroup: patient.bloodGroup,
      rank: patient.rank,
      regNo: patient.regNo,
      unit: patient.unit,
      ...operation.toObject?.() || operation // ensure plain object
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
},
getOperationIntraOpMonitoringByadmissionNo: async (req, res) => {
  try {
    const { admissionNo, operationId } = req.params;

    const patient = await Patient.findOne({
      admissionNo,
      hospital: req.hospital,
      'operations.operationId': operationId
    });

    if (!patient) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const operation = patient.operations.find(
      op => op.operationId === operationId
    );

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    // Ensure structure exists with default empty arrays
    const intraOpMonitoring = {
      vitals: operation.intraOpMonitoring?.vitals || [],
      medications: operation.intraOpMonitoring?.medications || [],
      fluidsAdministered: operation.intraOpMonitoring?.fluidsAdministered || [],
      otherVitals: operation.intraOpMonitoring?.otherVitals || []
    };

    res.json({ intraOpMonitoring });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
},
updateOperationIntraOpMonitoringByadmissionNo: async (req, res) => {
  try {
    const { admissionNo, operationId } = req.params;
    const { intraOpMonitoring } = req.body; // unpack here

    const patient = await Patient.findOne({ admissionNo });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const operation = patient.operations.find(op => op.operationId === operationId);
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }

    // Overwrite the whole intraOpMonitoring object
    operation.intraOpMonitoring = {
      ...operation.intraOpMonitoring,
      ...intraOpMonitoring
    };

    operation.markModified('intraOpMonitoring');

    console.log('Updated intraOpMonitoring:', JSON.stringify(operation.intraOpMonitoring, null, 2));

    await patient.save();

    res.json({
      message: 'Intra-op monitoring updated successfully',
      intraOpMonitoring: operation.intraOpMonitoring
    });
  } catch (error) {
    console.error('Error updating intra-op monitoring:', error);
    res.status(500).json({ message: 'Server error' });
  }
},
  // UPDATE Operation - Using $ positional operator
updateOperation: async (req, res) => {
  try {
    // 1. Prepare the update object
    const updateObj = {};
    for (const [key, value] of Object.entries(req.body)) {
      // Skip protected fields
      if (['admissionNo', 'operationId', 'createdAt', 'updatedAt'].includes(key)) continue;
      
      // Handle nested objects differently
      if (['preOpAssessment', 'intraOpMonitoring', 'recoveryStatus'].includes(key)) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          updateObj[`operations.$[elem].${key}.${nestedKey}`] = nestedValue;
        }
      } else {
        updateObj[`operations.$[elem].${key}`] = value;
      }
    }

    // 2. Perform the update
    const patient = await Patient.findOneAndUpdate(
      { 
        admissionNo: req.params.admissionNo,
        hospital: req.hospital
      },
      {
        $set: updateObj
      },
      {
        arrayFilters: [{ 'elem.operationId': req.params.operationId }],
        new: true,
        runValidators: true
      }
    );

    // 3. Handle response
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updatedOperation = patient.operations.find(
      op => op.operationId === req.params.operationId
    );

    if (!updatedOperation) {
      return res.status(404).json({ error: 'Operation not found after update' });
    }

    res.json(updatedOperation);
  } catch (error) {
    console.error('Update operation error:', error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update operation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  // DELETE Operation - Using $pull operator
  deleteOperation: async (req, res) => {
    try {
      const patient = await Patient.findOneAndUpdate(
        { admissionNo: req.params.admissionNo, hospital: req.hospital },
        { $pull: { operations: { operationId: req.params.operationId } } }, // Removes from array
        { new: true }
      );

      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json({ message: 'Operation deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Operation Status Management
  
  // Using $set with conditional logic
  
  updateOperationStatus: async (req, res) => {
    try {
      const { status, postponedDate } = req.body;
      
      const update = { $set: { 'operations.$.status': status } };
      if (status === 'postponed' && postponedDate) {
        update.$set['operations.$.postponedDate'] = new Date(postponedDate);
      }

      const patient = await Patient.findOneAndUpdate(
        { 
          admissionNo: req.params.admissionNo,
          hospital: req.hospital,
          'operations.operationId': req.params.operationId 
        },
        update,
        { new: true }
      );

      if (!patient) return res.status(404).json({ error: 'Operation not found' });
      res.json({ message: 'Operation status updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Using nested $set operations
  updatePreOpAssessment: async (req, res) => {
    try {
      const updateFields = {};
      Object.keys(req.body).forEach(key => {
        updateFields[`operations.$.preOpAssessment.${key}`] = req.body[key];
      });

      const patient = await Patient.findOneAndUpdate(
        { 
          admissionNo: req.params.admissionNo,
          hospital: req.hospital,
          'operations.operationId': req.params.operationId 
        },
        { $set: updateFields },
        { new: true }
      );

      if (!patient) return res.status(404).json({ error: 'Operation not found' });
      res.json({ message: 'Pre-op assessment updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Similar nested $set for intra-op monitoring
  updateIntraOpMonitoring: async (req, res) => {
    try {
      const updateFields = {};
      Object.keys(req.body).forEach(key => {
        updateFields[`operations.$.intraOpMonitoring.${key}`] = req.body[key];
      });

      const patient = await Patient.findOneAndUpdate(
        { 
          admissionNo: req.params.admissionNo,
          hospital: req.hospital,
          'operations.operationId': req.params.operationId 
        },
        { $set: updateFields },
        { new: true }
      );

      if (!patient) return res.status(404).json({ error: 'Operation not found' });
      res.json({ message: 'Intra-op monitoring updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Similar nested $set for recovery status
  updateRecoveryStatus: async (req, res) => {
    try {
      const updateFields = {};
      Object.keys(req.body).forEach(key => {
        updateFields[`operations.$.recoveryStatus.${key}`] = req.body[key];
      });

      const patient = await Patient.findOneAndUpdate(
        { 
          admissionNo: req.params.admissionNo,
          hospital: req.hospital,
          'operations.operationId': req.params.operationId 
        },
        { $set: updateFields },
        { new: true }
      );

      if (!patient) return res.status(404).json({ error: 'Operation not found' });
      res.json({ message: 'Recovery status updated' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Specialized Queries Using Aggregation
  
  // Using $unwind, $match, $sort, $group
  getTodayOperations: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const patients = await Patient.aggregate([
        { $match: { hospital: req.hospital } },
        { $unwind: '$operations' }, // Deconstructs operations array
        { 
          $match: { 
            'operations.date': { 
              $gte: today,
              $lt: tomorrow 
            },
            'operations.status': 'scheduled'
          } 
        },
        { $sort: { 'operations.date': 1 } },
        { 
          $group: {
            admissionNo: '$admissionNo',
            regNo: { $first: '$regNo' },
            name: { $first: '$name' },
            rank: { $first: '$rank' },
            operations: { $push: '$operations' }
          } 
        }
      ]);

      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Similar aggregation for pending operations
  getPendingOperations: async (req, res) => {
    try {
      const patients = await Patient.aggregate([
        { $match: { hospital: req.hospital } },
        { $unwind: '$operations' },
        { $match: { 'operations.status': { $in: ['scheduled', 'postponed'] } } },
        { $sort: { 'operations.date': 1 } },
        { 
          $group: {
            admissionNo: '$admissionNo',
            regNo: { $first: '$regNo' },
            name: { $first: '$name' },
            rank: { $first: '$rank' },
            operations: { $push: '$operations' }
          } 
        }
      ]);

      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Similar aggregation for completed operations with date range
  getCompletedOperations: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const matchCriteria = { 
        hospital: req.hospital,
        'operations.status': 'completed' 
      };

      if (start_date && end_date) {
        matchCriteria['operations.date'] = {
          $gte: new Date(start_date),
          $lt: new Date(end_date)
        };
      }

      const patients = await Patient.aggregate([
        { $match: matchCriteria },
        { $unwind: '$operations' },
        { $match: { 'operations.status': 'completed' } },
        { $sort: { 'operations.date': -1 } },
        { 
          $group: {
            admissionNo: '$admissionNo',
            regNo: { $first: '$regNo' },
            name: { $first: '$name' },
            rank: { $first: '$rank' },
            operations: { $push: '$operations' }
          } 
        }
      ]);

      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};