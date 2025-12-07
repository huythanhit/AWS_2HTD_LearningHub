// src/controllers/profile.controller.js
// Controller để user tự quản lý profile của mình

import { findUserByIdWithProfile, updateUserProfile } from '../models/user.model.js';
import { getS3Url } from '../config/s3.js';
import { successResponse } from '../utils/response.js';

/**
 * GET /api/my/profile
 * Lấy thông tin profile của user hiện tại
 */
export async function getMyProfile(req, res, next) {
  try {
    const userId = req.user.localUserId;

    if (!userId) {
      const err = new Error('LOCAL_USER_NOT_FOUND');
      err.status = 401;
      throw err;
    }

    const user = await findUserByIdWithProfile(userId);

    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    return successResponse(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name || '',
      phone: user.phone || '',
      avatar: user.avatar_s3_key ? getS3Url(user.avatar_s3_key) : null,
      bio: user.bio || '',
      roleName: req.user.roleName,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/my/profile
 * Cập nhật thông tin profile của user hiện tại
 */
export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.localUserId;

    if (!userId) {
      const err = new Error('LOCAL_USER_NOT_FOUND');
      err.status = 401;
      throw err;
    }

    const { fullName, phone, bio, avatar } = req.body;

    const updated = await updateUserProfile(userId, {
      fullName,
      phone,
      bio,
      avatar,
    });

    return successResponse(res, {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name || '',
      phone: updated.phone || '',
      avatar: updated.avatar_s3_key ? getS3Url(updated.avatar_s3_key) : null,
      bio: updated.bio || '',
    });
  } catch (err) {
    next(err);
  }
}
