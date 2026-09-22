'use strict';

const env = require('../../config/env');
const logger = require('../../utils/logger');

let warned = false;

function isConfigured() {
  return Boolean(env.whatsappPhoneNumberId && env.whatsappAccessToken);
}

/** Indian-first normalization: bare 10-digit numbers get a 91 country code. */
function normalizePhone(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Sends a free-form WhatsApp text message via Meta's Cloud API. Real
 * integration, dev-safe: with no WHATSAPP_PHONE_NUMBER_ID/ACCESS_TOKEN set
 * this logs and no-ops rather than throwing, exactly like the Razorpay
 * client in Module 6 — the app works the same with or without live
 * credentials, and callers never need to branch on "is WhatsApp on".
 *
 * Note: Meta requires an approved message template for the first
 * business-initiated message to a number (outside a 24h customer-service
 * window). This sends a plain text message, which works against test
 * numbers / within an open window; swap in a template call here once the
 * organizer's WhatsApp Business template is approved.
 */
async function sendWhatsAppMessage({ to, text }) {
  if (!isConfigured()) {
    if (!warned) {
      logger.warn('WhatsApp is not configured (WHATSAPP_PHONE_NUMBER_ID/ACCESS_TOKEN missing) — messages are logged, not sent.');
      warned = true;
    }
    logger.info(`[WhatsApp no-op] would message ${to}: ${text}`);
    return { sent: false, reason: 'not_configured' };
  }

  const url = `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(to),
        type: 'text',
        text: { body: text, preview_url: true },
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error(`WhatsApp send failed (${response.status})`, body);
      return { sent: false, reason: 'api_error', details: body };
    }

    return { sent: true, messageId: body.messages?.[0]?.id };
  } catch (err) {
    logger.error('WhatsApp send threw', err);
    return { sent: false, reason: 'network_error' };
  }
}

module.exports = { sendWhatsAppMessage, isConfigured, normalizePhone };
