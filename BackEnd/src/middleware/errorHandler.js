const { ApiError } = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  // Support both err.statusCode and err.status, defaulting to 500
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  const body = {
    success: false,
    message: err.message || 'Something went wrong.',
    code: code,
  };

  // Attach additional custom properties (e.g. transactionCount)
  if (err && typeof err === 'object') {
    Object.keys(err).forEach((k) => {
      if (!['status', 'statusCode', 'code', 'message'].includes(k)) {
        body[k] = err[k];
      }
    });
  }

  return res.status(statusCode).json(body);
}

module.exports = { errorHandler };

module.exports = { errorHandler };