'use strict';

const express = require('express');
const { getOverview } = require('../controllers/adminReportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', requireAuth, requireRole('superadmin', 'manager'), getOverview);

module.exports = router;
