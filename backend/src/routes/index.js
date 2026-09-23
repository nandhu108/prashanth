'use strict';

const express = require('express');
const mongoose = require('mongoose');
const publicEventRoutes = require('./publicEventRoutes');
const adminAuthRoutes = require('./adminAuthRoutes');
const adminEventRoutes = require('./adminEventRoutes');
const adminUploadRoutes = require('./adminUploadRoutes');
const adminTicketTypeRoutes = require('./adminTicketTypeRoutes');
const adminPromoRoutes = require('./adminPromoRoutes');
const publicPromoRoutes = require('./publicPromoRoutes');
const publicRegistrationRoutes = require('./publicRegistrationRoutes');
const adminRegistrationRoutes = require('./adminRegistrationRoutes');
const publicPaymentRoutes = require('./publicPaymentRoutes');
const adminPaymentRoutes = require('./adminPaymentRoutes');
const publicTicketRoutes = require('./publicTicketRoutes');
const adminCheckinRoutes = require('./adminCheckinRoutes');
const adminReportRoutes = require('./adminReportRoutes');
const adminUserRoutes = require('./adminUserRoutes');
const publicFeedbackRoutes = require('./publicFeedbackRoutes');
const adminFeedbackRoutes = require('./adminFeedbackRoutes');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

/** Liveness/readiness probe for NGINX, Docker and uptime monitoring. */
router.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

router.use('/public', publicEventRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/events', adminEventRoutes);
router.use('/admin/uploads', adminUploadRoutes);
router.use('/admin/ticket-types', adminTicketTypeRoutes);
router.use('/admin/promo', adminPromoRoutes);
router.use('/promo', publicPromoRoutes);
router.use('/registrations', publicRegistrationRoutes);
router.use('/admin/registrations', adminRegistrationRoutes);
router.use('/payments', publicPaymentRoutes);
router.use('/admin/payments', adminPaymentRoutes);
router.use('/tickets', publicTicketRoutes);
router.use('/admin/checkin', adminCheckinRoutes);
router.use('/admin/reports', adminReportRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/feedback', publicFeedbackRoutes);
router.use('/admin/feedback', adminFeedbackRoutes);

/*
 * Mount points reserved for upcoming modules:
 *   router.use('/admin/audit-log',     adminAuditLogRoutes);     // Module 13 - Security
 */

module.exports = router;
