'use strict';

const TicketType = require('../models/TicketType');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { evaluatePromoCode } = require('../services/promo');

/**
 * POST /api/v1/promo/validate
 * Body: { code, ticketTypeId }
 * A preview only — the registration flow (Module 3) re-evaluates the same
 * code with evaluatePromoCode() at submit time so a code can't be stretched
 * past its window or use count between preview and checkout.
 */
const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, ticketTypeId } = req.body;
  if (!code || !ticketTypeId) {
    throw ApiError.badRequest('A "code" and "ticketTypeId" are required.');
  }

  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType) throw ApiError.notFound('Ticket type not found');

  const result = await evaluatePromoCode(code, ticketType);
  if (!result.valid) return sendSuccess(res, { valid: false, reason: result.reason });

  return sendSuccess(res, {
    valid: true,
    code: result.promo.code,
    type: result.promo.type,
    value: result.promo.value,
    discountAmount: result.discountAmount,
    finalPrice: Math.max(ticketType.price - result.discountAmount, 0),
  });
});

module.exports = { validatePromoCode };
