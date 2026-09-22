'use strict';

const express = require('express');
const {
  listRegistrations,
  getRegistration,
  updateRegistration,
  cancelRegistration,
} = require('../controllers/adminRegistrationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin', 'manager'));

router.get('/', listRegistrations);
router.get('/:id', getRegistration);
router.patch('/:id', updateRegistration);
router.post('/:id/cancel', cancelRegistration);

module.exports = router;
