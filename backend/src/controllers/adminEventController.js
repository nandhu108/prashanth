'use strict';

const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { serializeEventForAdmin, serializeEventAdminCard } = require('../services/adminEventSerializer');

// Top-level fields the CMS may write directly. Nested arrays (speakers,
// agenda, sponsors, faqs, announcements) go through their own replace
// endpoints below; registeredCount/publishedAt are system-managed.
const EDITABLE_FIELDS = [
  'title',
  'slug',
  'tagline',
  'summary',
  'description',
  'category',
  'mode',
  'status',
  'startDate',
  'endDate',
  'timezone',
  'registrationOpensAt',
  'registrationClosesAt',
  'capacity',
  'organizer',
  'venue',
  'virtualLink',
  'contact',
  'seo',
  'theme',
  'highlights',
  'isFeatured',
];

function applyEditableFields(event, body) {
  for (const field of EDITABLE_FIELDS) {
    if (field in body) event[field] = body[field];
  }
}

async function findOr404(id) {
  const event = await Event.findById(id);
  if (!event) throw ApiError.notFound('Event not found');
  return event;
}

/** GET /api/v1/admin/events */
const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ startDate: -1 });
  return sendSuccess(res, events.map(serializeEventAdminCard));
});

/** POST /api/v1/admin/events */
const createEvent = asyncHandler(async (req, res) => {
  const event = new Event({ status: 'draft' });
  applyEditableFields(event, req.body || {});
  await event.save();
  return sendSuccess(res, serializeEventForAdmin(event), { status: 201 });
});

/** GET /api/v1/admin/events/:id */
const getEvent = asyncHandler(async (req, res) => {
  const event = await findOr404(req.params.id);
  return sendSuccess(res, serializeEventForAdmin(event));
});

/** PATCH /api/v1/admin/events/:id */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await findOr404(req.params.id);
  applyEditableFields(event, req.body || {});
  await event.save();
  return sendSuccess(res, serializeEventForAdmin(event));
});

/** DELETE /api/v1/admin/events/:id — drafts only; publish first, then cancel instead of deleting. */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await findOr404(req.params.id);
  if (event.status !== 'draft') {
    throw ApiError.conflict('Only draft events can be deleted. Set status to "cancelled" instead.');
  }
  await event.deleteOne();
  return sendSuccess(res, null, { status: 200, message: 'Event deleted' });
});

/** Factory for the five "replace this whole embedded array" endpoints. */
function replaceArrayField(field) {
  return asyncHandler(async (req, res) => {
    const event = await findOr404(req.params.id);
    const value = req.body[field];
    if (!Array.isArray(value)) throw ApiError.badRequest(`Expected "${field}" to be an array.`);
    event[field] = value;
    await event.save();
    return sendSuccess(res, serializeEventForAdmin(event)[field]);
  });
}

const replaceSpeakers = replaceArrayField('speakers');
const replaceAgenda = replaceArrayField('agenda');
const replaceSponsors = replaceArrayField('sponsors');
const replaceFaqs = replaceArrayField('faqs');
const replaceAnnouncements = replaceArrayField('announcements');

module.exports = {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  replaceSpeakers,
  replaceAgenda,
  replaceSponsors,
  replaceFaqs,
  replaceAnnouncements,
};
