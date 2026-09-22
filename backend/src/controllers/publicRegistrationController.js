'use strict';

const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const PromoCode = require('../models/PromoCode');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { serializeRegistrationForPublic } = require('../services/registrationSerializer');
const { evaluatePromoCode } = require('../services/promo');
const inventory = require('../services/inventory');
const { sendTicketConfirmation } = require('../services/whatsapp/sendTicket');
const logger = require('../utils/logger');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REGISTRATION_STATE_MESSAGES = {
  'not-yet-open': 'Registration has not opened yet.',
  closed: 'Registration for this event is closed.',
  'sold-out': 'This event is sold out.',
  completed: 'This event has already taken place.',
  cancelled: 'This event has been cancelled.',
  unavailable: 'Registration is not available for this event.',
};

function assertAttendee(attendee) {
  if (!attendee || !attendee.name?.trim()) throw ApiError.badRequest('Attendee name is required.');
  if (!attendee.email || !EMAIL_RE.test(attendee.email)) throw ApiError.badRequest('A valid email is required.');
  if (!attendee.phone?.trim()) throw ApiError.badRequest('Attendee phone number is required.');
}

function computePricing(ticketType, discountAmount) {
  const basePrice = ticketType.price;
  const subtotal = Math.max(basePrice - discountAmount, 0);
  const taxAmount = ticketType.taxPercent ? Math.round(subtotal * (ticketType.taxPercent / 100) * 100) / 100 : 0;
  return {
    basePrice,
    discountAmount,
    taxAmount,
    totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
    currency: ticketType.currency,
  };
}

/** POST /api/v1/registrations */
const createRegistration = asyncHandler(async (req, res) => {
  const { eventSlug, ticketTypeId, attendee, promoCode: promoCodeInput, campaignSource } = req.body;

  if (!eventSlug || !ticketTypeId) {
    throw ApiError.badRequest('"eventSlug" and "ticketTypeId" are required.');
  }
  assertAttendee(attendee);

  const event = await Event.findPublishedBySlug(eventSlug);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.registrationState !== 'open') {
    throw ApiError.conflict(REGISTRATION_STATE_MESSAGES[event.registrationState] || 'Registration is not open.');
  }

  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType || !ticketType.event.equals(event._id)) {
    throw ApiError.notFound('Ticket type not found for this event.');
  }
  if (ticketType.saleState !== 'on-sale') {
    throw ApiError.conflict('This pass is not currently available.');
  }

  let promo = null;
  let discountAmount = 0;
  if (promoCodeInput) {
    const result = await evaluatePromoCode(promoCodeInput, ticketType);
    if (!result.valid) throw ApiError.badRequest(result.reason);
    promo = result.promo;
    discountAmount = result.discountAmount;
  }

  const pricing = computePricing(ticketType, discountAmount);
  const attendeeClean = {
    name: attendee.name.trim(),
    email: attendee.email.trim().toLowerCase(),
    phone: attendee.phone.trim(),
    participantType: attendee.participantType?.trim() || '',
  };

  await inventory.releaseStaleHolds(ticketType._id);

  if (pricing.totalAmount === 0) {
    // Free / fully-discounted pass: confirm immediately, no payment step.
    const sold = await inventory.sellTicketDirect(ticketType._id);
    if (!sold) throw ApiError.conflict('This pass just sold out. Please pick another pass.');

    const seated = await inventory.takeEventSeat(event._id);
    if (!seated) {
      await inventory.releaseTicketSale(ticketType._id);
      throw ApiError.conflict('This event just reached capacity.');
    }

    const reg = new Registration({
      event: event._id,
      ticketType: ticketType._id,
      attendee: attendeeClean,
      promoCode: promo ? promo._id : null,
      pricing,
      status: 'confirmed',
      campaignSource: campaignSource || '',
    });
    reg.issueQrToken();
    await reg.save();

    if (promo) {
      await PromoCode.updateOne(
        { _id: promo._id, $expr: { $or: [{ $eq: ['$maxUses', 0] }, { $lt: ['$usedCount', '$maxUses'] }] } },
        { $inc: { usedCount: 1 } }
      );
    }

    try {
      await sendTicketConfirmation({ event, ticketType, registration: reg });
    } catch (err) {
      logger.error(`WhatsApp confirmation failed for ${reg.registrationCode}`, err);
    }

    return sendSuccess(res, serializeRegistrationForPublic(reg), { status: 201 });
  }

  // Paid pass: hold inventory, leave the event seat count for payment
  // confirmation (Module 6) so abandoned carts don't inflate "seats left".
  const held = await inventory.holdTicket(ticketType._id);
  if (!held) throw ApiError.conflict('This pass just sold out. Please pick another pass.');

  const reg = new Registration({
    event: event._id,
    ticketType: ticketType._id,
    attendee: attendeeClean,
    promoCode: promo ? promo._id : null,
    pricing,
    status: 'pending_payment',
    campaignSource: campaignSource || '',
  });
  await reg.save();

  return sendSuccess(res, serializeRegistrationForPublic(reg), { status: 201 });
});

/** GET /api/v1/registrations/:code — an attendee checking their own registration status. */
const getRegistrationByCode = asyncHandler(async (req, res) => {
  const reg = await Registration.findOne({ registrationCode: req.params.code.toUpperCase() });
  if (!reg) throw ApiError.notFound('Registration not found');
  return sendSuccess(res, serializeRegistrationForPublic(reg));
});

module.exports = { createRegistration, getRegistrationByCode };
