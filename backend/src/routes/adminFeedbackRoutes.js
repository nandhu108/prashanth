'use strict';

const express = require('express');
const { listFeedback } = require('../controllers/adminFeedbackController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('superadmin', 'manager'), listFeedback);

module.exports = router;
