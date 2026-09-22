'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess, asyncHandler } = require('../utils/response');
const { hashPassword } = require('../utils/password');
const { serializeUser } = require('../services/userSerializer');

/** GET /api/v1/admin/users */
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return sendSuccess(res, users.map(serializeUser));
});

/** POST /api/v1/admin/users */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    throw ApiError.badRequest('Name, email and password are required.');
  }
  if (password.length < 8) throw ApiError.badRequest('Password must be at least 8 characters.');

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: ['superadmin', 'manager', 'checkin_staff'].includes(role) ? role : 'manager',
  });

  return sendSuccess(res, serializeUser(user), { status: 201 });
});

/** PATCH /api/v1/admin/users/:id */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.role && ['superadmin', 'manager', 'checkin_staff'].includes(req.body.role)) {
    user.role = req.body.role;
  }
  if ('isActive' in req.body) {
    if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
      throw ApiError.badRequest('You cannot deactivate your own account.');
    }
    user.isActive = Boolean(req.body.isActive);
  }
  if (req.body.newPassword) {
    if (req.body.newPassword.length < 8) throw ApiError.badRequest('Password must be at least 8 characters.');
    user.passwordHash = await hashPassword(req.body.newPassword);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  }

  await user.save();
  return sendSuccess(res, serializeUser(user));
});

/** DELETE /api/v1/admin/users/:id */
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  await user.deleteOne();
  return sendSuccess(res, null, { status: 200, message: 'User deleted' });
});

module.exports = { listUsers, createUser, updateUser, deleteUser };
