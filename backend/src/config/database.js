'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

let connectionPromise = null;

/**
 * Connects to MongoDB once per process. Repeated calls reuse the same promise,
 * which keeps the seed script and the HTTP server from opening rival pools.
 */
async function connectDatabase(uri = env.mongoUri) {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
      autoIndex: !env.isProduction,
    })
    .then((conn) => {
      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
  });

  return connectionPromise;
}

async function disconnectDatabase() {
  connectionPromise = null;
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

module.exports = { connectDatabase, disconnectDatabase };
