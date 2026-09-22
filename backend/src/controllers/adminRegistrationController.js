'use strict';

const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { serializeRegistrationForAdmin } = require('../services/registrationSerializer');
const inventory = require('../services/inventory');

/** GET /api/v1/admin/registrations?event=&status=&q=&page=&limit= */
const listRegistrations = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.event) filter.event = req.query.event;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const q = String(req.query.q).trim();
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ 'attendee.name': re }, { 'attendee.email': re }, { 'attendee.phone': re }, { registrationCode: re }];
  }

  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .populate('event', 'title slug')
      .populate('ticketType', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(filter),
  ]);

  return sendSuccess(res, registrations.map(serializeRegistrationForAdmin), {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/v1/admin/registrations/:id */
const getRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id)
    .populate('event', 'title slug')
    .populate('ticketType', 'name code price');
  if (!reg) throw ApiError.notFound('Registration not found');
  return sendSuccess(res, serializeRegistrationForAdmin(reg));
});

/** PATCH /api/v1/admin/registrations/:id — staff notes / attendee corrections only. */
const updateRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) throw ApiError.notFound('Registration not found');

  if ('notes' in req.body) reg.notes = req.body.notes;
  if (req.body.attendee) {
    reg.attendee = { ...reg.attendee.toObject(), ...req.body.attendee };
  }
  await reg.save();
  return sendSuccess(res, serializeRegistrationForAdmin(reg));
});

/** POST /api/v1/admin/registrations/:id/cancel — releases whatever inventory it was holding. */
const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) throw ApiError.notFound('Registration not found');
  if (reg.status === 'cancelled' || reg.status === 'refunded') {
    throw ApiError.conflict('This registration is already cancelled.');
  }

  if (reg.status === 'pending_payment') {
    await inventory.releaseTicketHold(reg.ticketType);
  } else if (reg.status === 'confirmed') {
    await inventory.releaseTicketSale(reg.ticketType);
    await inventory.releaseEventSeat(reg.event);
  }

  reg.status = 'cancelled';
  if (req.body?.reason) reg.notes = `${reg.notes ? reg.notes + ' | ' : ''}Cancelled: ${req.body.reason}`;
  await reg.save();

  return sendSuccess(res, serializeRegistrationForAdmin(reg));
});

module.exports = { listRegistrations, getRegistration, updateRegistration, cancelRegistration };
