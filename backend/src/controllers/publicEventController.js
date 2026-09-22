'use strict';

const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { serializeEventForPublic, serializeEventCard, serializeTicketTypeForPublic } =
  require('../services/eventSerializer');

/**
 * GET /api/v1/public/events
 * Listing of published events for an "all events" page / campaign landing.
 */
const listEvents = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
  const skip = (page - 1) * limit;

  const filter = { status: { $in: ['published', 'registration-closed'] } };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.upcoming === 'true') filter.endDate = { $gte: new Date() };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ isFeatured: -1, startDate: 1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  return sendSuccess(res, events.map(serializeEventCard), {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/v1/public/events/:slug
 * Full microsite payload: event content + visible ticket types.
 * Captures the campaign source (?utm_source=whatsapp, ?src=qr-poster) so
 * Module 10's dashboard can attribute registrations later.
 */
const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findPublishedBySlug(req.params.slug);

  if (!event) {
    throw ApiError.notFound('We could not find this event. It may have been moved or unpublished.');
  }

  const ticketTypes = await TicketType.find({
    event: event._id,
    isActive: true,
    isPubliclyVisible: true,
  }).sort({ order: 1, price: 1 });

  return sendSuccess(res, {
    event: serializeEventForPublic(event),
    ticketTypes: ticketTypes.map(serializeTicketTypeForPublic),
  });
});

/**
 * GET /api/v1/public/events/:slug/ticket-types
 * Used by the registration flow (Module 3/4) to refresh live availability.
 */
const getTicketTypes = asyncHandler(async (req, res) => {
  const event = await Event.findPublishedBySlug(req.params.slug).select('_id');
  if (!event) throw ApiError.notFound('Event not found');

  const ticketTypes = await TicketType.find({
    event: event._id,
    isActive: true,
    isPubliclyVisible: true,
  }).sort({ order: 1, price: 1 });

  return sendSuccess(res, ticketTypes.map(serializeTicketTypeForPublic));
});

module.exports = { listEvents, getEventBySlug, getTicketTypes };
