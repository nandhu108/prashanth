'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Who did what, when. Written best-effort (see services/auditLog.js) so a
 * logging hiccup never blocks the actual admin action it's recording.
 */
const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: { type: String, trim: true, default: '' }, // denormalized so the log reads fine even if the user is later deleted
    action: { type: String, required: true, trim: true }, // e.g. "event.update", "user.create"
    entityType: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.Mixed, default: null },
    meta: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'at', updatedAt: false } }
);

AuditLogSchema.index({ at: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
