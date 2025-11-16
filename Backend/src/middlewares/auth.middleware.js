import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { errorResponse } from '../utils/response.js';

dotenv.config();

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded: { sub: userId, email, role_id, iat, exp }
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}
