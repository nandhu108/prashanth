'use strict';

const { Types } = require('mongoose');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { toCsv } = require('../utils/csv');

/**
 * GET /api/v1/admin/reports/overview?event=<eventId>
 * Backs both the Dashboard's stat tiles (Module 10) and the fuller Reports
 * page (Module 11) — one source of truth for "how is this event doing".
 */
const getOverview = asyncHandler(async (req, res) => {
  if (!req.query.event) throw ApiError.badRequest('An "event" id is required.');
  const event = req.query.event;

  const [byStatus, revenueAgg, checkedInCount, byTicketType] = await Promise.all([
    Registration.aggregate([{ $match: { event: toObjectId(event) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Registration.aggregate([
      { $match: { event: toObjectId(event), status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Registration.countDocuments({ event, status: 'confirmed', checkedInAt: { $ne: null } }),
    Registration.aggregate([
      { $match: { event: toObjectId(event), status: 'confirmed' } },
      { $group: { _id: '$ticketType', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } },
      { $lookup: { from: 'tickettypes', localField: '_id', foreignField: '_id', as: 'ticketType' } },
      { $unwind: { path: '$ticketType', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$ticketType.name', count: 1, revenue: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const statusCounts = { pending_payment: 0, confirmed: 0, cancelled: 0, refunded: 0 };
  for (const row of byStatus) statusCounts[row._id] = row.count;

  const confirmed = statusCounts.confirmed;

  return sendSuccess(res, {
    registrations: {
      confirmed,
      pending: statusCounts.pending_payment,
      cancelled: statusCounts.cancelled + statusCounts.refunded,
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    },
    revenue: revenueAgg[0]?.total || 0,
    checkIn: {
      checkedIn: checkedInCount,
      total: confirmed,
      rate: confirmed > 0 ? Math.round((checkedInCount / confirmed) * 100) : 0,
    },
    byTicketType: byTicketType.map((t) => ({ name: t.name || 'Unknown', count: t.count, revenue: t.revenue })),
  });
});

function toObjectId(id) {
  return new Types.ObjectId(String(id));
}

const REGISTRATION_COLUMNS = [
  { key: 'registrationCode', label: 'Registration Code' },
  { key: 'attendee.name', label: 'Attendee Name' },
  { key: 'attendee.email', label: 'Email' },
  { key: 'attendee.phone', label: 'Phone' },
  { key: 'attendee.participantType', label: 'Participant Type' },
  { key: 'ticketTypeName', label: 'Pass' },
  { key: 'status', label: 'Status' },
  { key: 'pricing.basePrice', label: 'Base Price' },
  { key: 'pricing.discountAmount', label: 'Discount' },
  { key: 'pricing.taxAmount', label: 'Tax' },
  { key: 'pricing.totalAmount', label: 'Total' },
  { key: 'campaignSource', label: 'Campaign Source' },
  { key: 'checkedInAtStr', label: 'Checked In At' },
  { key: 'createdAtStr', label: 'Registered At' },
];

/** GET /api/v1/admin/reports/export/registrations.csv?event=<eventId> */
const exportRegistrationsCsv = asyncHandler(async (req, res) => {
  if (!req.query.event) throw ApiError.badRequest('An "event" id is required.');

  const registrations = await Registration.find({ event: req.query.event })
    .populate('ticketType', 'name')
    .sort({ createdAt: 1 });

  const rows = registrations.map((r) => ({
    ...r.toObject(),
    ticketTypeName: r.ticketType?.name || '',
    checkedInAtStr: r.checkedInAt ? r.checkedInAt.toISOString() : '',
    createdAtStr: r.createdAt.toISOString(),
  }));

  const csv = toCsv(rows, REGISTRATION_COLUMNS);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="registrations.csv"');
  res.send(csv);
});

const PAYMENT_COLUMNS = [
  { key: 'registrationCode', label: 'Registration Code' },
  { key: 'attendeeName', label: 'Attendee Name' },
  { key: 'razorpayOrderId', label: 'Order ID' },
  { key: 'razorpayPaymentId', label: 'Payment ID' },
  { key: 'amountRupees', label: 'Amount (INR)' },
  { key: 'status', label: 'Status' },
  { key: 'method', label: 'Method' },
  { key: 'createdAtStr', label: 'Created At' },
];

/** GET /api/v1/admin/reports/export/payments.csv?event=<eventId> */
const exportPaymentsCsv = asyncHandler(async (req, res) => {
  if (!req.query.event) throw ApiError.badRequest('An "event" id is required.');

  const payments = await Payment.find()
    .populate({ path: 'registration', match: { event: req.query.event }, select: 'registrationCode attendee' })
    .sort({ createdAt: 1 });

  const rows = payments
    .filter((p) => p.registration) // the populate match above drops non-matching refs to null
    .map((p) => ({
      ...p.toObject(),
      registrationCode: p.registration.registrationCode,
      attendeeName: p.registration.attendee.name,
      amountRupees: (p.amount / 100).toFixed(2),
      createdAtStr: p.createdAt.toISOString(),
    }));

  const csv = toCsv(rows, PAYMENT_COLUMNS);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="payments.csv"');
  res.send(csv);
});

module.exports = { getOverview, exportRegistrationsCsv, exportPaymentsCsv };
