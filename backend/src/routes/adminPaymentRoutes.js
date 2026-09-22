'use strict';

const express = require('express');
const { listPayments } = require('../controllers/adminPaymentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('superadmin', 'manager'), listPayments);

module.exports = router;
