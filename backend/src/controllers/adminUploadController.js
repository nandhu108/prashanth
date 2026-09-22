'use strict';

const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');

/** POST /api/v1/admin/uploads — returns a relative URL the CMS stores on an image field. */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded.');
  return sendSuccess(res, { url: `/uploads/${req.file.filename}` }, { status: 201 });
});

module.exports = { uploadImage };
