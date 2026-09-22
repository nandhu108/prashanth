'use strict';

const express = require('express');
const { uploadImage } = require('../controllers/adminUploadController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');

const router = express.Router();

router.post('/', requireAuth, requireRole('superadmin', 'manager'), uploadSingleImage, uploadImage);

module.exports = router;
