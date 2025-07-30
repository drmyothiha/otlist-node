const express = require('express');
const router = express.Router();
const icuPatientController = require('../controllers/icuPatientController');
const { verifyToken, setHospitalContext } = require('../middlewares/auth');

// Apply essential middlewares to all routes
router.use(verifyToken);
router.use(setHospitalContext);

// ICU Patient CRUD Routes
router.post('/', icuPatientController.createICUPatient);
router.get('/', icuPatientController.getAllICUPatients); // Modify as needed for filters
router.get('/:regNo', icuPatientController.getICUPatientByRegNo);
router.put('/:regNo', icuPatientController.updateICUPatient);
router.delete('/:regNo', icuPatientController.deleteICUPatient);

module.exports = router;
