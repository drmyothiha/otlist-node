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
router.get('/:admissionNo', patientController.getPatientByAdmissionNo);
router.patch('/:admissionNo', patientController.updatePatient);
router.delete('/:admissionNo', patientController.deletePatient);

// Operation-specific Routes
router.post('/:admissionNo/operations', patientController.addOperation);
router.get('/:admissionNo/operations', patientController.getAllOperations);
router.get('/:admissionNo/operations/:operationId', patientController.getOperationByadmissionNo);

router.patch('/:admissionNo/operations/:operationId', patientController.updateOperation);
router.delete('/:admissionNo/operations/:operationId', patientController.deleteOperation);

// Operation Status Routes
router.patch('/:admissionNo/operations/:operationId/status', patientController.updateOperationStatus);
router.patch('/:admissionNo/operations/:operationId/preop', patientController.updatePreOpAssessment);
router.get('/:admissionNo/operations/:operationId/intraop', patientController.getOperationIntraOpMonitoringByadmissionNo);
router.patch('/:admissionNo/operations/:operationId/intraop', patientController.updateOperationIntraOpMonitoringByadmissionNo);
router.patch('/:admissionNo/operations/:operationId/recovery', patientController.updateRecoveryStatus);

// Specialized Queries
router.get('/today/operations', patientController.getTodayOperations);
router.get('/pending/operations', patientController.getPendingOperations);
router.get('/completed/operations', patientController.getCompletedOperations);

module.exports = router;

