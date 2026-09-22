/**
 * Mock API for frontend development WITHOUT a MongoDB instance.
 *
 *   npm run mock
 *
 * It serves the real seed payload through the real serializer, so the JSON the
 * microsite receives is byte-for-byte what the live API returns. Useful for
 * front-end work, design review and CI visual checks before the database is
 * provisioned. Never used in production.
 */
process.env.NODE_ENV = 'development';

const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const {
  serializeEventForPublic,
  serializeTicketTypeForPublic,
} = require('../services/eventSerializer');

// Pull the literal seed payloads out of the seed module without running it.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../seed/seedEvent.js'), 'utf8');
const body = src
  .replace(/^'use strict';/, '')
  .replace(/const \{ connectDatabase[\s\S]*?logger'\);/, '')
  .replace(/async function seed\(\)[\s\S]*$/, '')
  .concat('\nreturn { eventData, ticketTypesData };');
const { eventData, ticketTypesData } = new Function(body)();

const eventDoc = new Event(eventData);
const ticketDocs = ticketTypesData
  .filter((t) => t.isPubliclyVisible !== false)
  .map((t) => new TicketType({ ...t, event: new mongoose.Types.ObjectId() }));

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/v1/public/events/:slug', async (req, res) => {
  await eventDoc.validate();
  res.json({
    success: true,
    data: {
      event: serializeEventForPublic(eventDoc),
      ticketTypes: ticketDocs.map(serializeTicketTypeForPublic),
    },
  });
});

const PORT = process.env.MOCK_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
  console.log(`  GET /api/v1/public/events/${eventData.slug}`);
});
