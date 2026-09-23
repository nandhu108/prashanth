'use strict';

const express = require('express');
const { getOverview, exportRegistrationsCsv, exportPaymentsCsv } = require('../controllers/adminReportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin', 'manager'));

router.get('/overview', getOverview);
router.get('/export/registrations.csv', exportRegistrationsCsv);
router.get('/export/payments.csv', exportPaymentsCsv);

module.exports = router;
