const { ApiError } = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { success: false, message: err.message, code: err.code };
   
    Object.keys(err).forEach((k) => {                                                                  // include any extra properties the error was thrown with (e.g. transactionCount)
      if (!['status', 'code', 'message'].includes(k)) body[k] = err[k];
    });
    return res.status(err.status).json(body);
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong.' });
}

module.exports = { errorHandler };