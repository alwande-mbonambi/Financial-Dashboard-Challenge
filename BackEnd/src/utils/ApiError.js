class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || message.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }
}

module.exports = { ApiError };