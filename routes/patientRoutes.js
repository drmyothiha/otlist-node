const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, setHospitalContext } = require('../middlewares/auth');

// Apply essential middlewares to all routes
router.use(verifyToken);
router.use(setHospitalContext);

// Patient CRUD Routes
router.post('/', patientController.createPatient);
router.get('/', patientController.getAllPatients); // Modified for date filter
router.get('/:id', patientController.getPatientById);
router.patch('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

module.exports = router;
