'use strict';

const PromoCode = require('../models/PromoCode');

/**
 * Shared by the public /promo/validate preview (publicPromoController) and
 * the registration flow itself (publicRegistrationController), so a code's
 * rules are evaluated identically in both places.
 */
async function evaluatePromoCode(rawCode, ticketType) {
  const code = String(rawCode || '').toUpperCase().trim();
  if (!code) return { valid: false, reason: 'No code provided.' };

  const promo = await PromoCode.findOne({ event: ticketType.event, code });
  if (!promo) return { valid: false, reason: 'This code is not valid for this event.' };
  if (!promo.isValidNow) return { valid: false, reason: 'This code has expired or is no longer active.' };
  if (
    promo.applicableTicketTypes.length > 0 &&
    !promo.applicableTicketTypes.some((id) => id.equals(ticketType._id))
  ) {
    return { valid: false, reason: 'This code does not apply to the selected pass.' };
  }

  const discountAmount = promo.computeDiscount(ticketType.price);
  return { valid: true, promo, discountAmount };
}

module.exports = { evaluatePromoCode };
