'use strict';

const { sendWhatsAppMessage } = require('./client');
const env = require('../../config/env');

/**
 * Fires the post-confirmation WhatsApp message. Called from both the
 * free-registration instant-confirm path (Module 3) and the payment
 * confirm path (Module 6) — always await-with-catch at the call site so a
 * WhatsApp outage never fails the registration/payment response itself.
 */
function sendTicketConfirmation({ event, ticketType, registration }) {
  const ticketUrl = `${env.publicSiteUrl}/tickets/${registration.qrToken}`;
  const text =
    `Hi ${registration.attendee.name}! 🎉\n\n` +
    `Your registration for *${event.title}* is confirmed.\n\n` +
    `Pass: ${ticketType.name}\n` +
    `Reference: ${registration.registrationCode}\n\n` +
    `View your digital ticket & QR code:\n${ticketUrl}`;

  return sendWhatsAppMessage({ to: registration.attendee.phone, text });
}

module.exports = { sendTicketConfirmation };
