'use strict';

/** Never let passwordHash or lockout internals leave the API. */
function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

module.exports = { serializeUser };
