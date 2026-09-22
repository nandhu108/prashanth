'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Reads an env var, falling back to a default. Throws in production when a
 * required value is missing so misconfiguration fails loudly at boot instead
 * of silently at request time.
 */
function read(key, fallback, { required = false } = {}) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (required && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  return value;
}

function readList(key, fallback = []) {
  const raw = read(key, '');
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readInt(key, fallback) {
  const parsed = Number.parseInt(read(key, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: read('NODE_ENV', 'development'),
  port: readInt('PORT', 5000),
  mongoUri: read('MONGODB_URI', 'mongodb://127.0.0.1:27017/prashanth_events', {
    required: true,
  }),
  publicSiteUrl: read('PUBLIC_SITE_URL', 'http://localhost:5173'),
  apiBaseUrl: read('API_BASE_URL', 'http://localhost:5000'),
  corsOrigins: readList('CORS_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:4173',
  ]),
  rateLimit: {
    windowMs: readInt('RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
    max: readInt('RATE_LIMIT_MAX', 300),
  },
};

env.isProduction = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

module.exports = env;
