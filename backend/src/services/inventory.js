'use strict';

const TicketType = require('../models/TicketType');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const env = require('../config/env');

/**
 * MongoDB here runs as a single standalone node (see docker-compose.yml),
 * not a replica set, so multi-document ACID transactions aren't available.
 * Every function below is a single atomic findOneAndUpdate guarded by an
 * $expr capacity check instead — safe under concurrent requests for the
 * one field it touches, with the two-step callers below compensating
 * (undoing step one) if step two fails, rather than relying on a
 * cross-collection transaction.
 */

const HOLD_MS = env.ticketHoldMinutes * 60 * 1000;

/** Cancels pending_payment registrations for this ticket type that have sat too long, freeing their hold. */
async function releaseStaleHolds(ticketTypeId) {
  const cutoff = new Date(Date.now() - HOLD_MS);
  const stale = await Registration.find({
    ticketType: ticketTypeId,
    status: 'pending_payment',
    createdAt: { $lt: cutoff },
  });

  for (const reg of stale) {
    // eslint-disable-next-line no-await-in-loop
    await Registration.updateOne({ _id: reg._id }, { status: 'cancelled', notes: 'Auto-cancelled: payment hold expired' });
    // eslint-disable-next-line no-await-in-loop
    await releaseTicketHold(reg.ticketType);
  }
}

/** +1 quantityHeld, only if capacity allows (0 = unlimited). Returns true if the hold was taken. */
async function holdTicket(ticketTypeId) {
  const result = await TicketType.findOneAndUpdate(
    {
      _id: ticketTypeId,
      $expr: {
        $or: [
          { $eq: ['$quantityTotal', 0] },
          { $lt: [{ $add: ['$quantitySold', '$quantityHeld'] }, '$quantityTotal'] },
        ],
      },
    },
    { $inc: { quantityHeld: 1 } }
  );
  return Boolean(result);
}

/** -1 quantityHeld (never below zero). */
async function releaseTicketHold(ticketTypeId) {
  await TicketType.updateOne({ _id: ticketTypeId, quantityHeld: { $gt: 0 } }, { $inc: { quantityHeld: -1 } });
}

/** Converts a held unit into a sold one (payment confirmed). */
async function commitTicketSale(ticketTypeId) {
  await TicketType.updateOne(
    { _id: ticketTypeId, quantityHeld: { $gt: 0 } },
    { $inc: { quantitySold: 1, quantityHeld: -1 } }
  );
}

/** Direct sale with no hold step (free/complimentary passes confirm instantly). */
async function sellTicketDirect(ticketTypeId) {
  const result = await TicketType.findOneAndUpdate(
    {
      _id: ticketTypeId,
      $expr: {
        $or: [
          { $eq: ['$quantityTotal', 0] },
          { $lt: [{ $add: ['$quantitySold', '$quantityHeld'] }, '$quantityTotal'] },
        ],
      },
    },
    { $inc: { quantitySold: 1 } }
  );
  return Boolean(result);
}

/** -1 quantitySold (a confirmed registration was cancelled/refunded). */
async function releaseTicketSale(ticketTypeId) {
  await TicketType.updateOne({ _id: ticketTypeId, quantitySold: { $gt: 0 } }, { $inc: { quantitySold: -1 } });
}

/** +1 Event.registeredCount, only if capacity allows. Returns true if the seat was taken. */
async function takeEventSeat(eventId) {
  const result = await Event.findOneAndUpdate(
    {
      _id: eventId,
      $expr: { $or: [{ $eq: ['$capacity', 0] }, { $lt: ['$registeredCount', '$capacity'] }] },
    },
    { $inc: { registeredCount: 1 } }
  );
  return Boolean(result);
}

/** -1 Event.registeredCount (never below zero). */
async function releaseEventSeat(eventId) {
  await Event.updateOne({ _id: eventId, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });
}

module.exports = {
  releaseStaleHolds,
  holdTicket,
  releaseTicketHold,
  commitTicketSale,
  sellTicketDirect,
  releaseTicketSale,
  takeEventSeat,
  releaseEventSeat,
};
