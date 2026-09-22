'use strict';

const PromoCode = require('../models/PromoCode');
const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { serializePromoCodeForAdmin } = require('../services/promoCodeSerializer');

const EDITABLE_FIELDS = [
  'code',
  'description',
  'type',
  'value',
  'maxUses',
  'validFrom',
  'validTo',
  'applicableTicketTypes',
  'isActive',
];

function applyEditableFields(promo, body) {
  for (const field of EDITABLE_FIELDS) {
    if (field in body) promo[field] = body[field];
  }
  if (promo.code) promo.code = String(promo.code).toUpperCase().trim();
}

async function findOr404(id) {
  const promo = await PromoCode.findById(id);
  if (!promo) throw ApiError.notFound('Promo code not found');
  return promo;
}

/** GET /api/v1/admin/promo?event=<eventId> */
const listPromoCodes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.event) filter.event = req.query.event;
  const promos = await PromoCode.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, promos.map(serializePromoCodeForAdmin));
});

/** POST /api/v1/admin/promo */
const createPromoCode = asyncHandler(async (req, res) => {
  const { event: eventId } = req.body;
  if (!eventId) throw ApiError.badRequest('An "event" id is required.');
  const event = await Event.findById(eventId).select('_id');
  if (!event) throw ApiError.notFound('Event not found');

  const promo = new PromoCode({ event: eventId });
  applyEditableFields(promo, req.body || {});
  await promo.save();
  return sendSuccess(res, serializePromoCodeForAdmin(promo), { status: 201 });
});

/** PATCH /api/v1/admin/promo/:id */
const updatePromoCode = asyncHandler(async (req, res) => {
  const promo = await findOr404(req.params.id);
  applyEditableFields(promo, req.body || {});
  await promo.save();
  return sendSuccess(res, serializePromoCodeForAdmin(promo));
});

/** DELETE /api/v1/admin/promo/:id — only before it's ever been redeemed. */
const deletePromoCode = asyncHandler(async (req, res) => {
  const promo = await findOr404(req.params.id);
  if (promo.usedCount > 0) {
    throw ApiError.conflict('This code has been redeemed. Deactivate it instead of deleting.');
  }
  await promo.deleteOne();
  return sendSuccess(res, null, { status: 200, message: 'Promo code deleted' });
});

module.exports = { listPromoCodes, createPromoCode, updatePromoCode, deletePromoCode };
