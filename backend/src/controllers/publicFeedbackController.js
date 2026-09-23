'use strict';

const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');

/**
 * POST /api/v1/feedback
 * Body: { qrToken, rating, comments }
 * qrToken (unguessable, only ever known to the ticket-holder) is the spam
 * gate — no separate auth needed, same pattern as the ticket routes.
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const { qrToken, rating, comments } = req.body;
  if (!qrToken) throw ApiError.badRequest('A ticket reference is required.');
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw ApiError.badRequest('Rating must be a whole number from 1 to 5.');
  }

  const reg = await Registration.findOne({ qrToken });
  if (!reg) throw ApiError.notFound('Ticket not found');
  if (reg.status !== 'confirmed') {
    throw ApiError.conflict('Feedback can only be submitted for a confirmed registration.');
  }

  let feedback;
  try {
    feedback = await Feedback.create({
      event: reg.event,
      registration: reg._id,
      rating: ratingNum,
      comments: comments || '',
    });
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('You have already submitted feedback for this event.');
    }
    throw err;
  }

  return sendSuccess(res, { id: feedback._id, rating: feedback.rating }, { status: 201 });
});

module.exports = { submitFeedback };
