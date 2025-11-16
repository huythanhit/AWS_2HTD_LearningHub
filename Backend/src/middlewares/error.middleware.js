import { errorResponse } from '../utils/response.js';

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const errors = err.errors || undefined;
  return errorResponse(res, message, statusCode, errors);
}
