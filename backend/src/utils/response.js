'use strict';

/**
 * One response envelope for every endpoint, so the React clients can rely on
 * `success` + `data` / `error` without special-casing each route.
 */

function sendSuccess(res, data = null, { status = 200, message = undefined, meta = undefined } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function sendError(res, { status = 500, message = 'Something went wrong', code = undefined, details = undefined }) {
  const body = { success: false, error: { message } };
  if (code) body.error.code = code;
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

/** Wraps async route handlers so rejections reach the error middleware. */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { sendSuccess, sendError, asyncHandler };
