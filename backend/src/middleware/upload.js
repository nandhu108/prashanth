'use strict';

const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { uploadDir } = require('../config/uploadPath');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPEG, PNG, WebP or SVG images are allowed.'));
    return;
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES } });

module.exports = { uploadSingleImage: upload.single('file') };
