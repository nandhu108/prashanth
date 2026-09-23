'use strict';

const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { recordAudit } = require('../services/auditLog');

/**
 * The scanner reads whatever the QR encodes — a full
 * `{PUBLIC_SITE_URL}/tickets/:qrToken` URL (see Module 7) if scanned by our
 * own admin tool, or possibly a bare token if pasted manually. Either way,
 * the token is just the last path segment.
 */
function extractToken(raw) {
  const str = String(raw || '').trim();
  if (!str) return '';
  const parts = str.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

/** POST /api/v1/admin/checkin/scan  Body: { qrToken } */
const scanTicket = asyncHandler(async (req, res) => {
  const token = extractToken(req.body.qrToken);
  if (!token) throw ApiError.badRequest('No QR token provided.');

  const reg = await Registration.findOne({ qrToken: token })
    .populate('event', 'title')
    .populate('ticketType', 'name');

  if (!reg) throw ApiError.notFound('No ticket found for this code.');

  if (reg.status !== 'confirmed') {
    throw ApiError.conflict(`This registration is ${reg.status.replace('_', ' ')}, not a valid ticket.`);
  }

  const payload = {
    registrationCode: reg.registrationCode,
    attendee: reg.attendee,
    event: reg.event,
    ticketType: reg.ticketType,
  };

  if (reg.checkedInAt) {
    return sendSuccess(res, { result: 'already-checked-in', checkedInAt: reg.checkedInAt, ...payload });
  }

  reg.checkedInAt = new Date();
  reg.checkedInBy = req.user._id;
  await reg.save();

  recordAudit(req, { action: 'registration.checkin', entityType: 'Registration', entityId: reg._id, meta: { registrationCode: reg.registrationCode } });
  return sendSuccess(res, { result: 'success', checkedInAt: reg.checkedInAt, ...payload });
});

/** GET /api/v1/admin/checkin/stats?event=<eventId> */
const getCheckinStats = asyncHandler(async (req, res) => {
  if (!req.query.event) throw ApiError.badRequest('An "event" id is required.');

  const [total, checkedIn] = await Promise.all([
    Registration.countDocuments({ event: req.query.event, status: 'confirmed' }),
    Registration.countDocuments({ event: req.query.event, status: 'confirmed', checkedInAt: { $ne: null } }),
  ]);

  return sendSuccess(res, { total, checkedIn, remaining: total - checkedIn });
});

module.exports = { scanTicket, getCheckinStats, extractToken };
