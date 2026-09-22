'use strict';

const Razorpay = require('razorpay');
const env = require('../config/env');
const logger = require('../utils/logger');

let client = null;
let warned = false;

/**
 * Returns a cached Razorpay SDK client, or null if RAZORPAY_KEY_ID/SECRET
 * aren't set. Callers decide what "not configured" means for their route —
 * this never throws, so the app boots fine with payments dark until real
 * test/live keys are added to .env (same dev-safe philosophy as the
 * WhatsApp client in Module 8).
 */
function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    if (!warned) {
      logger.warn('Razorpay is not configured (RAZORPAY_KEY_ID/SECRET missing) — payments are disabled.');
      warned = true;
    }
    return null;
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  }
  return client;
}

function isConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

module.exports = { getRazorpayClient, isConfigured };
