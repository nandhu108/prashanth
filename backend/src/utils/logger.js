'use strict';

/**
 * Minimal structured logger. Kept dependency-free so it works in the seed
 * script and in serverless-style environments. Swap for pino/winston later
 * without touching call sites.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level) {
  return LEVELS[level] <= (LEVELS[activeLevel] ?? LEVELS.info);
}

function format(level, message, meta) {
  const stamp = new Date().toISOString();
  const base = `[${stamp}] [${level.toUpperCase()}] ${message}`;
  if (meta === undefined) return base;
  if (meta instanceof Error) return `${base}\n${meta.stack}`;
  try {
    return `${base} ${JSON.stringify(meta)}`;
  } catch {
    return `${base} ${String(meta)}`;
  }
}

module.exports = {
  error: (msg, meta) => shouldLog('error') && console.error(format('error', msg, meta)),
  warn: (msg, meta) => shouldLog('warn') && console.warn(format('warn', msg, meta)),
  info: (msg, meta) => shouldLog('info') && console.log(format('info', msg, meta)),
  debug: (msg, meta) => shouldLog('debug') && console.log(format('debug', msg, meta)),
};
