// src/controllers/auth.controller.js
// Nhận request từ router, validate, gọi service và trả response

import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { successResponse, errorResponse } from "../utils/response.js";
import * as authService from "../services/auth.service.js";

// Đăng ký tài khoản
export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const result = await authService.register(value);
    return successResponse(res, result, "User registered successfully", 201);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Đăng nhập
export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const result = await authService.login(value);
    return successResponse(res, result, "Login successful", 200);
  } catch (err) {
    // Bắt các lỗi đã được map trong service (ví dụ: EMAIL_NOT_VERIFIED, INVALID_CREDENTIALS, ...)
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Xác thực email bằng mã code (sau khi user nhận email từ Cognito):
export async function confirmEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return errorResponse(res, "email và code là bắt buộc", 400, [
        "email and code are required",
      ]);
    }

    await authService.confirmEmail({ email, code });
    return successResponse(res, null, "Email verified successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Gửi lại mã xác thực email
export async function resendConfirmCode(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "email là bắt buộc", 400, [
        "email is required",
      ]);
    }

    await authService.resendConfirmCode({ email });
    return successResponse(
      res,
      null,
      "Verification code resent successfully",
      200
    );
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Lấy thông tin user hiện tại
export async function me(req, res, next) {
  try {
    const userId = req.user.localUserId;
    const user = await authService.getCurrentUser(userId);
    return successResponse(res, user, "User profile", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Route debug:
export async function debugToken(req, res, next) {
  try {
    return successResponse(res, req.user, "Cognito token info", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Gửi mã quên mật khẩu
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "email là bắt buộc", 400, [
        "email is required",
      ]);
    }

    await authService.forgotPassword({ email });
    return successResponse(
      res,
      null,
      "Forgot password code sent successfully",
      200
    );
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Xác nhận quên mật khẩu (code + mật khẩu mới)
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    const errors = [];
    if (!email) errors.push("email is required");
    if (!code) errors.push("code is required");
    if (!newPassword) errors.push("newPassword is required");

    if (errors.length > 0) {
      return errorResponse(res, "Validation error", 400, errors);
    }

    await authService.resetPassword({ email, code, newPassword });
    return successResponse(res, null, "Password reset successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Logout
export async function logout(req, res, next) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return errorResponse(res, "Access token is required", 400);
    }

    const result = await authService.logout({ accessToken });
    return successResponse(res, result, "Logged out successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}
