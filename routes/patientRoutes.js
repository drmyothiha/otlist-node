const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, setHospitalContext } = require('../middlewares/auth');

// Apply essential middlewares to all routes
router.use(verifyToken);
router.use(setHospitalContext);

// Patient CRUD Routes
router.post('/', patientController.createPatient);
router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.patch('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

// Operation Scheduling Routes
router.get('/schedule/:date', patientController.getDailySchedule);
router.get('/upcoming', patientController.getUpcomingSurgeries);
router.patch('/:id/status', patientController.updateSurgeryStatus);

// OT Management Routes
router.get('/ot/:type', patientController.getOtPatients);
router.get('/status/:status', patientController.getPatientsByStatus);

// Surgical Team Routes
router.get('/team/surgeons', patientController.getSurgeonList);
router.get('/team/anaesthetists', patientController.getAnaesthetistList);

module.exports = router;