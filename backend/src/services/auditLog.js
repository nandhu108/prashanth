'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Fire-and-forget audit write. Called from admin mutation controllers as
 * `recordAudit(req, {...}).catch(() => {})` (or left un-awaited) so a
 * logging failure never blocks the actual action it's recording — same
 * "never let a side-channel break the primary flow" philosophy as the
 * WhatsApp send in Module 8.
 */
async function recordAudit(req, { action, entityType, entityId, meta }) {
  try {
    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      action,
      entityType,
      entityId,
      meta,
      ip: req.ip,
    });
  } catch (err) {
    logger.error(`Failed to write audit log for ${action}`, err);
  }
}

module.exports = { recordAudit };
