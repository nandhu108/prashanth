'use strict';

const crypto = require('crypto');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const PromoCode = require('../models/PromoCode');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { getRazorpayClient, isConfigured } = require('../services/razorpay');
const { serializeRegistrationForPublic } = require('../services/registrationSerializer');
const inventory = require('../services/inventory');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * POST /api/v1/payments/orders
 * Creates a Razorpay order for a pending_payment registration. The frontend
 * then opens Razorpay's Checkout widget with the returned orderId + keyId.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { registrationId } = req.body;
  if (!registrationId) throw ApiError.badRequest('"registrationId" is required.');

  const client = getRazorpayClient();
  if (!client) {
    // A 409, not 500: this is an expected, user-facing state (no test/live
    // keys added yet), and errorHandler masks every 5xx message in
    // production — masking this one would hide a message we want shown.
    throw ApiError.conflict('Online payments are not configured yet. Our team will reach out to complete your registration.');
  }

  const reg = await Registration.findById(registrationId);
  if (!reg) throw ApiError.notFound('Registration not found');
  if (reg.status !== 'pending_payment') {
    throw ApiError.conflict(`This registration is ${reg.status.replace('_', ' ')} and cannot be paid again.`);
  }

  const amountPaise = Math.round(reg.pricing.totalAmount * 100);
  const order = await client.orders.create({
    amount: amountPaise,
    currency: reg.pricing.currency || 'INR',
    receipt: reg.registrationCode,
    notes: { registrationId: String(reg._id), registrationCode: reg.registrationCode },
  });

  const payment = await Payment.create({
    registration: reg._id,
    razorpayOrderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    status: 'created',
  });

  reg.payment = payment._id;
  await reg.save();

  return sendSuccess(res, {
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    keyId: env.razorpayKeyId,
    registrationCode: reg.registrationCode,
    attendee: reg.attendee,
  });
});

/** Shared by /verify and the webhook: converts a held pass into a confirmed, ticketed registration. */
async function finalizePaidRegistration(reg) {
  await inventory.commitTicketSale(reg.ticketType);

  const seated = await inventory.takeEventSeat(reg.event);
  if (!seated) {
    // Extremely rare (capacity filled between hold and payment capture).
    // The attendee already paid — don't strand them ticketless; log it for
    // an admin to reconcile manually rather than silently over-booking.
    logger.error(`Event capacity exceeded confirming paid registration ${reg.registrationCode} — needs manual review`);
  }

  reg.status = 'confirmed';
  reg.issueQrToken();
  await reg.save();

  if (reg.promoCode) {
    await PromoCode.updateOne(
      { _id: reg.promoCode, $expr: { $or: [{ $eq: ['$maxUses', 0] }, { $lt: ['$usedCount', '$maxUses'] }] } },
      { $inc: { usedCount: 1 } }
    );
  }
}

/**
 * POST /api/v1/payments/verify
 * The immediate-confirm path: called right after Razorpay Checkout's success
 * handler fires client-side. The webhook below is the source of truth and
 * reconciles anything this call misses (closed tab, network drop, etc.).
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!orderId || !paymentId || !signature) {
    throw ApiError.badRequest('Missing Razorpay order/payment/signature.');
  }
  if (!isConfigured()) throw ApiError.conflict('Payments are not configured.');

  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) throw ApiError.badRequest('Payment signature verification failed.');

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment) throw ApiError.notFound('Payment not found');

  if (payment.status !== 'paid') {
    payment.status = 'paid';
    payment.razorpayPaymentId = paymentId;
    payment.razorpaySignature = signature;
    await payment.save();

    const reg = await Registration.findById(payment.registration);
    if (reg && reg.status === 'pending_payment') {
      await finalizePaidRegistration(reg);
    }
  }

  const reg = await Registration.findById(payment.registration);
  return sendSuccess(res, serializeRegistrationForPublic(reg));
});

/**
 * POST /api/v1/payments/webhook
 * Server-to-server from Razorpay. Signature (X-Razorpay-Signature) is the
 * only authentication — verified over the exact raw bytes captured in
 * app.js, not a re-serialization of req.body.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  if (!env.razorpayWebhookSecret) {
    logger.warn('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set — ignoring.');
    return res.status(200).json({ success: true });
  }

  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', env.razorpayWebhookSecret).update(req.rawBody).digest('hex');

  if (!signature || expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return res.status(400).json({ success: false, error: { message: 'Invalid webhook signature' } });
  }

  const event = req.body.event;

  try {
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const entity = req.body.payload.payment.entity;
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.razorpayPaymentId = entity.id;
        payment.method = entity.method || '';
        payment.rawWebhook = req.body;
        await payment.save();

        const reg = await Registration.findById(payment.registration);
        if (reg && reg.status === 'pending_payment') {
          await finalizePaidRegistration(reg);
        }
      }
    } else if (event === 'payment.failed') {
      const entity = req.body.payload.payment.entity;
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (payment && payment.status === 'created') {
        payment.status = 'failed';
        payment.failureReason = entity.error_description || 'Payment failed';
        payment.rawWebhook = req.body;
        await payment.save();
        // Leave the registration's hold in place so the attendee can retry
        // without losing their spot; it expires naturally like any other.
      }
    }
  } catch (err) {
    logger.error('Error processing Razorpay webhook', err);
    // Still 200: the signature was valid, so this is our bug, not theirs —
    // retrying the same payload won't fix it, and we don't want a retry storm.
  }

  return res.status(200).json({ success: true });
});

module.exports = { createOrder, verifyPayment, handleWebhook };
