const express = require('express');
const router = express.Router();
const studyController = require('../controllers/study.controller');
const { authenticateResearcher } = require('../middleware/auth.middleware');

// Public study & student endpoints
router.get('/studies', studyController.getAllStudies);
router.get('/study/:studyCode', studyController.getStudyByCode);
router.post('/student/signup', studyController.studentSignup);
router.post('/student/submit-reading', studyController.submitReading);

// Protected researcher study endpoints
router.post('/study/create', authenticateResearcher, studyController.createStudy);
router.get('/study/:studyCode/readings', authenticateResearcher, studyController.getStudyReadings);

module.exports = router;
