// src/utils/ApiError.js

class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    if (errors) this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
