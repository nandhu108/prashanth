'use strict';

const Payment = require('../models/Payment');
const { sendSuccess, asyncHandler } = require('../utils/response');

/** GET /api/v1/admin/payments?status=&page=&limit= — read-only ledger for reconciliation. */
const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: 'registration',
        select: 'registrationCode attendee event',
        populate: { path: 'event', select: 'title' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return sendSuccess(res, payments, { meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
});

module.exports = { listPayments };
