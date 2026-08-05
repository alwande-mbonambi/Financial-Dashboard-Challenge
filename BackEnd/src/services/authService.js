const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authService = {
  async register(email, password) {
    const anyUser = await db('users').first();
     if (anyUser) {
    throw new Error('Registration is closed — an owner account already exists.');
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
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
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