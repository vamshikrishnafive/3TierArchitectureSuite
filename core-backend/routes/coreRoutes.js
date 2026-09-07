const express = require('express');
const router = express.Router();
const coreController = require('../controllers/coreController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protected Routes
router.get('/dashboard', authenticateToken, coreController.getDashboard);
router.post('/activity', authenticateToken, coreController.createActivity);

module.exports = router;
