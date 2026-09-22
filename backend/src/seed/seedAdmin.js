'use strict';

/**
 * Bootstraps the first superadmin account from ADMIN_BOOTSTRAP_EMAIL/PASSWORD.
 * Safe to re-run: it upserts by email and never overwrites an existing
 * password (so re-running after someone changes it doesn't reset it back).
 *
 *   npm run seed:admin
 */

const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/User');
const env = require('../config/env');
const { hashPassword } = require('../utils/password');
const logger = require('../utils/logger');

async function seedAdmin() {
  await connectDatabase();

  const email = env.adminBootstrapEmail.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    logger.info(`Admin already exists, leaving password untouched: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(env.adminBootstrapPassword);
  await User.create({
    name: env.adminBootstrapName,
    email,
    passwordHash,
    role: 'superadmin',
  });

  logger.info(`Seeded superadmin: ${email}`);
  logger.warn('Change the bootstrap password after first login if this is a real deployment.');
}

seedAdmin()
  .then(() => disconnectDatabase())
  .catch(async (err) => {
    logger.error('Admin seed failed', err);
    await disconnectDatabase();
    process.exit(1);
  });
