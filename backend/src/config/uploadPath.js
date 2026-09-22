'use strict';

const path = require('path');
const fs = require('fs');
const env = require('./env');

/**
 * Resolves UPLOAD_DIR to an absolute path once: relative in local dev
 * (backend/uploads), absolute in Docker (/app/uploads, matching the volume
 * mount in docker-compose.yml). Both the multer middleware and the
 * express.static mount in app.js import this so they always agree.
 */
const uploadDir = path.isAbsolute(env.uploadDir)
  ? env.uploadDir
  : path.resolve(__dirname, '../../', env.uploadDir);

fs.mkdirSync(uploadDir, { recursive: true });

module.exports = { uploadDir };
