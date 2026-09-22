'use strict';

const express = require('express');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/adminUserController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// User/role management is superadmin-only, unlike the manager+ CMS/sales routes.
router.use(requireAuth, requireRole('superadmin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
