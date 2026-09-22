'use strict';

const { Types } = require('mongoose');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');

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

module.exports = { getOverview };
