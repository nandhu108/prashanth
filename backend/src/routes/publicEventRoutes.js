'use strict';

const express = require('express');
const {
  listEvents,
  getEventBySlug,
  getTicketTypes,
} = require('../controllers/publicEventController');

const router = express.Router();

router.get('/events', listEvents);
router.get('/events/:slug', getEventBySlug);
router.get('/events/:slug/ticket-types', getTicketTypes);

module.exports = router;
