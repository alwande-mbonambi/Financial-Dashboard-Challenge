const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ApiError } = require('../utils/ApiError');

const authService = {
  async register(email, password) {
    const anyUser = await db('users').first();
    if (anyUser) {
      throw new ApiError(409, 'Registration is closed — an owner account already exists.', 'REGISTRATION_CLOSED');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({
      email,
      password_hash,
    });

    return { id, email };
  },

  async login(email, password) {
    const user = await db('users').where({ email }).first();
    if (!user) {
     throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET ,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email },
    };
  },
};

module.exports = authService;