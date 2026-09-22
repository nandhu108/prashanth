'use strict';

const express = require('express');
const {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} = require('../controllers/adminPromoController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin', 'manager'));

router.get('/', listPromoCodes);
router.post('/', createPromoCode);
router.patch('/:id', updatePromoCode);
router.delete('/:id', deletePromoCode);

module.exports = router;
