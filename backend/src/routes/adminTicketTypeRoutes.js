'use strict';

const express = require('express');
const {
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} = require('../controllers/adminTicketTypeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin', 'manager'));

router.get('/', listTicketTypes);
router.post('/', createTicketType);
router.patch('/:id', updateTicketType);
router.delete('/:id', deleteTicketType);

module.exports = router;
