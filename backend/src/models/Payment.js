'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * One Razorpay order attempt for a Registration. A registration can have
 * more than one Payment if an earlier attempt failed and the attendee
 * retried — Registration.payment always points at the most recent one.
 */
const PaymentSchema = new Schema(
  {
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    amount: { type: Number, required: true, min: 0 }, // paise
    currency: { type: String, default: 'INR' },

    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created', index: true },
    method: { type: String, default: '' },
    failureReason: { type: String, default: '' },

    // Last webhook payload received for this payment, kept for support/audit.
    rawWebhook: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
