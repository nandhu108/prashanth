'use strict';

const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/response');
const env = require('../config/env');
const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  return sendError(res, {
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code;
  let details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid value for ${err.path}`;
  } else if (err && err.code === 11000) {
    status = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  } else if (err instanceof ApiError) {
    code = code || 'API_ERROR';
    details = err.details;
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${status}`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${message}`);
  }

  // Never leak internals in production.
  if (status >= 500 && env.isProduction) {
    message = 'Something went wrong. Please try again.';
    details = undefined;
  }

  const payload = { status, message, code, details };
  if (!env.isProduction && status >= 500) payload.details = { stack: err.stack };

  return sendError(res, payload);
}

module.exports = { notFoundHandler, errorHandler };
