'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const AttendeeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    participantType: { type: String, trim: true, default: '' }, // e.g. "PG Student"
  },
  { _id: false }
);

const PricingSchema = new Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

/**
 * One attendee's registration for one pass. Payment (Module 6), the
 * QR/PDF ticket (Module 7) and check-in (Module 9) all key off this
 * document rather than introducing their own attendee records.
 */
const RegistrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    ticketType: { type: Schema.Types.ObjectId, ref: 'TicketType', required: true },

    attendee: { type: AttendeeSchema, required: true },
    promoCode: { type: Schema.Types.ObjectId, ref: 'PromoCode', default: null },
    pricing: { type: PricingSchema, required: true },

    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending_payment',
      index: true,
    },

    payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },

    registrationCode: { type: String, unique: true, index: true },
    qrToken: { type: String, unique: true, sparse: true, index: true },

    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    certificateIssuedAt: { type: Date, default: null },

    campaignSource: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

RegistrationSchema.index({ event: 1, status: 1 });
RegistrationSchema.index({ 'attendee.email': 1 });

RegistrationSchema.virtual('isFree').get(function isFree() {
  return this.pricing.totalAmount === 0;
});

RegistrationSchema.pre('validate', function assignCodesOnCreate(next) {
  if (this.isNew && !this.registrationCode) {
    this.registrationCode = `REG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  next();
});

/** Generates the ticket's scan token. Called once, when a registration is confirmed. */
RegistrationSchema.methods.issueQrToken = function issueQrToken() {
  this.qrToken = crypto.randomBytes(24).toString('hex');
  return this.qrToken;
};

module.exports = mongoose.model('Registration', RegistrationSchema);
