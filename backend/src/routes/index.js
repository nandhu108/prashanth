'use strict';

const express = require('express');
const mongoose = require('mongoose');
const publicEventRoutes = require('./publicEventRoutes');
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

/*
 * Mount points reserved for upcoming modules:
 *   router.use('/admin',        adminRoutes);        // Module 2  - Event CMS
 *   router.use('/registration', registrationRoutes); // Module 3  - Registration
 *   router.use('/tickets',      ticketRoutes);       // Module 4  - Ticketing
 *   router.use('/promo',        promoRoutes);        // Module 5  - Promo codes
 *   router.use('/payments',     paymentRoutes);      // Module 6  - Gateway
 *   router.use('/checkin',      checkinRoutes);      // Module 9  - Event-day
 */

module.exports = router;
