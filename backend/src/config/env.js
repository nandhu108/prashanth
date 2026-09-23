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
  // Number of reverse proxies in front of the API whose X-Forwarded-For entry
  // is trusted: 1 for NGINX/compose, 2 for Vercel rewrite -> Render.
  trustProxy: readInt('TRUST_PROXY', 1),
  publicSiteUrl: read('PUBLIC_SITE_URL', 'http://localhost:5173'),
  apiBaseUrl: read('API_BASE_URL', 'http://localhost:5000'),
  corsOrigins: readList('CORS_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:8082',
  ]),
  rateLimit: {
    windowMs: readInt('RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
    max: readInt('RATE_LIMIT_MAX', 300),
  },

  // --- Auth (Foundation) ---
  jwtSecret: read('JWT_SECRET', 'dev-only-insecure-secret-change-me', { required: true }),
  jwtExpiresIn: read('JWT_EXPIRES_IN', '7d'),
  adminBootstrapEmail: read('ADMIN_BOOTSTRAP_EMAIL', 'admin@prashanthhospitals.com'),
  adminBootstrapPassword: read('ADMIN_BOOTSTRAP_PASSWORD', 'ChangeMe123!'),
  adminBootstrapName: read('ADMIN_BOOTSTRAP_NAME', 'Platform Admin'),

  // --- Uploads (Module 2) ---
  uploadDir: read('UPLOAD_DIR', 'uploads'),

  // --- Ticketing / holds (Module 3-4) ---
  ticketHoldMinutes: readInt('TICKET_HOLD_MINUTES', 15),

  // --- Payments (Module 6) ---
  razorpayKeyId: read('RAZORPAY_KEY_ID', ''),
  razorpayKeySecret: read('RAZORPAY_KEY_SECRET', ''),
  razorpayWebhookSecret: read('RAZORPAY_WEBHOOK_SECRET', ''),

  // --- WhatsApp (Module 8) ---
  whatsappPhoneNumberId: read('WHATSAPP_PHONE_NUMBER_ID', ''),
  whatsappAccessToken: read('WHATSAPP_ACCESS_TOKEN', ''),
  whatsappApiVersion: read('WHATSAPP_API_VERSION', 'v20.0'),
};

env.isProduction = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

module.exports = env;
