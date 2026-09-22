'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAdminToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyAdminToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAdminToken, verifyAdminToken };
