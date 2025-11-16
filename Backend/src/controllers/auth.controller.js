// src/controllers/auth.controller.js
// Nhận request từ router, validate, gọi service và trả response

import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const result = await authService.register(value);
    return successResponse(res, result, 'User registered successfully', 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const result = await authService.login(value);
    return successResponse(res, result, 'Login successful', 200);
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const userId = req.user.localUserId; // id trong DB, set bởi authMiddleware
    const user = await authService.getCurrentUser(userId);
    return successResponse(res, user, 'User profile', 200);
  } catch (err) {
    return next(err);
  }
}

// Route debug: trả lại thông tin token Cognito + mapping roles
export async function debugToken(req, res, next) {
  try {
    return successResponse(res, req.user, 'Cognito token info', 200);
  } catch (err) {
    return next(err);
  }
}
