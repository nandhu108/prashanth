'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * A discount code scoped to one event. Redemption bookkeeping (usedCount)
 * and the final pricing snapshot live on Registration (Module 3) — this
 * model is the rule set, not the ledger.
 */
const PromoCodeSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },

    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: '' },

    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },

    maxUses: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },

    validFrom: { type: Date, default: null },
    validTo: {
      type: Date,
      default: null,
      validate: {
        validator: function afterFrom(value) {
          if (!this || typeof this.get !== 'function') return true;
          const from = this.get('validFrom');
          if (!from || !value) return true;
          return value >= from;
        },
        message: 'validTo must be on or after validFrom',
      },
    },

    // Empty = applies to every ticket type on the event.
    applicableTicketTypes: [{ type: Schema.Types.ObjectId, ref: 'TicketType' }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PromoCodeSchema.index({ event: 1, code: 1 }, { unique: true });

PromoCodeSchema.virtual('usesRemaining').get(function usesRemaining() {
  if (!this.maxUses || this.maxUses === 0) return null; // unlimited
  return Math.max(this.maxUses - this.usedCount, 0);
});

/** Whether the code can be redeemed right now, independent of any specific pass. */
PromoCodeSchema.virtual('isValidNow').get(function isValidNow() {
  if (!this.isActive) return false;
  const now = Date.now();
  if (this.validFrom && this.validFrom.getTime() > now) return false;
  if (this.validTo && this.validTo.getTime() < now) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
});

/** Applies this code's rule to a base price, returning a rounded discount amount. */
PromoCodeSchema.methods.computeDiscount = function computeDiscount(basePrice) {
  if (this.type === 'percent') {
    return Math.round(basePrice * (this.value / 100) * 100) / 100;
  }
  return Math.min(this.value, basePrice);
};

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
