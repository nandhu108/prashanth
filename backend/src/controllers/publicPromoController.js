'use strict';

const PromoCode = require('../models/PromoCode');
const TicketType = require('../models/TicketType');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');

/**
 * POST /api/v1/promo/validate
 * Body: { code, ticketTypeId }
 * A preview only — Module 3/6 re-validate and persist the actual pricing
 * snapshot at registration time so a code can't be double-counted or
 * stretched past its window between preview and checkout.
 */
const validatePromoCode = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').toUpperCase().trim();
  const { ticketTypeId } = req.body;

  if (!code || !ticketTypeId) {
    throw ApiError.badRequest('A "code" and "ticketTypeId" are required.');
  }

  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType) throw ApiError.notFound('Ticket type not found');

  const promo = await PromoCode.findOne({ event: ticketType.event, code });

  const invalid = (reason) => sendSuccess(res, { valid: false, reason });

  if (!promo) return invalid('This code is not valid for this event.');
  if (!promo.isValidNow) return invalid('This code has expired or is no longer active.');
  if (
    promo.applicableTicketTypes.length > 0 &&
    !promo.applicableTicketTypes.some((id) => id.equals(ticketType._id))
  ) {
    return invalid('This code does not apply to the selected pass.');
  }

  const discountAmount = promo.computeDiscount(ticketType.price);

  return sendSuccess(res, {
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discountAmount,
    finalPrice: Math.max(ticketType.price - discountAmount, 0),
  });
});

module.exports = { validatePromoCode };
