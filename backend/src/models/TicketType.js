'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * A purchasable/claimable pass for an event.
 * Module 1 exposes these read-only on the microsite; Module 4 (Ticketing) and
 * Module 6 (Payments) build allocation, holds and reconciliation on top.
 */
const TicketTypeSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    name: { type: String, required: true, trim: true }, // Regular / Couple / VIP
    code: { type: String, required: true, trim: true, uppercase: true }, // REG, CPL, VIP
    description: { type: String, trim: true, default: '' },

    kind: {
      type: String,
      enum: ['free', 'paid', 'vip', 'complimentary', 'couple'],
      default: 'paid',
    },

    price: { type: Number, default: 0, min: 0 }, // in INR
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },

    // How many attendees a single ticket admits (Couple = 2).
    admitsCount: { type: Number, default: 1, min: 1 },

    quantityTotal: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    quantitySold: { type: Number, default: 0, min: 0 },
    quantityHeld: { type: Number, default: 0, min: 0 }, // reserved during checkout

    minPerOrder: { type: Number, default: 1, min: 1 },
    maxPerOrder: { type: Number, default: 5, min: 1 },

    salesStartAt: { type: Date, default: null },
    salesEndAt: { type: Date, default: null },

    benefits: [{ type: String, trim: true }],

    // Complimentary passes are issued by admins, never shown as buyable.
    isPubliclyVisible: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },

    // Restrict a pass to certain participant categories (e.g. "PG Student").
    allowedParticipantTypes: [{ type: String, trim: true }],

    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TicketTypeSchema.index({ event: 1, code: 1 }, { unique: true });
TicketTypeSchema.index({ event: 1, order: 1 });

TicketTypeSchema.virtual('isFree').get(function isFree() {
  return this.price === 0 || this.kind === 'free' || this.kind === 'complimentary';
});

TicketTypeSchema.virtual('priceWithTax').get(function priceWithTax() {
  if (!this.taxPercent) return this.price;
  return Math.round(this.price * (1 + this.taxPercent / 100) * 100) / 100;
});

TicketTypeSchema.virtual('quantityAvailable').get(function quantityAvailable() {
  if (!this.quantityTotal || this.quantityTotal === 0) return null; // unlimited
  return Math.max(this.quantityTotal - this.quantitySold - this.quantityHeld, 0);
});

TicketTypeSchema.virtual('isSoldOut').get(function isSoldOut() {
  const available = this.quantityAvailable;
  return available !== null && available <= 0;
});

/** Whether this pass can be selected on the public site right now. */
TicketTypeSchema.virtual('saleState').get(function saleState() {
  const now = Date.now();
  if (!this.isActive) return 'inactive';
  if (this.salesStartAt && this.salesStartAt.getTime() > now) return 'not-yet-open';
  if (this.salesEndAt && this.salesEndAt.getTime() < now) return 'closed';
  if (this.isSoldOut) return 'sold-out';
  return 'on-sale';
});

module.exports = mongoose.model('TicketType', TicketTypeSchema);
