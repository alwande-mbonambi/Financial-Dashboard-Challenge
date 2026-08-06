const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.', 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token.', 'INVALID_TOKEN');
  }
}

module.exports = { requireAuth }; 