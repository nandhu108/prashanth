'use strict';

const express = require('express');
const { listAuditLog } = require('../controllers/adminAuditLogController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Who-did-what is superadmin-only, same as user management.
router.get('/', requireAuth, requireRole('superadmin'), listAuditLog);

module.exports = router;
