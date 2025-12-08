// src/controllers/profile.controller.js
// Controller để user tự quản lý profile của mình

import { findUserByIdWithProfile, updateUserProfile } from '../models/user.model.js';
import { extractS3Key, deleteFileFromS3 } from '../services/s3.service.js';
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

    // Tạo public URL cho avatar nếu có (bucket public)
    let avatarUrl = null;
    if (user.avatar_s3_key) {
      avatarUrl = getS3Url(user.avatar_s3_key);
    }

    return successResponse(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name || '',
      phone: user.phone || '',
      avatar: avatarUrl,
      avatarS3Key: user.avatar_s3_key || null, // Giữ lại s3Key để có thể dùng sau
      bio: user.bio || '',
      roleName: req.user.roleName,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/my/profile
 * Cập nhật thông tin profile của user hiện tại
 * Nhận avatar là URL từ API upload-image
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

    // Lấy user hiện tại để có avatar cũ
    const currentUser = await findUserByIdWithProfile(userId);
    const oldAvatarS3Key = currentUser?.avatar_s3_key;

    // Extract S3 key từ avatar URL nếu có
    let avatarS3Key = undefined; // undefined = không update, null = xóa avatar
    if (avatar !== undefined) {
      if (avatar && avatar.trim() !== '') {
        // Có URL mới, extract S3 key
        avatarS3Key = extractS3Key(avatar);
      } else {
        // Avatar là empty string hoặc null, xóa avatar
        avatarS3Key = null;
      }
    }

    // Xóa avatar cũ trên S3 nếu:
    // 1. Có avatar mới khác avatar cũ, HOẶC
    // 2. User muốn xóa avatar (avatarS3Key = null) và có avatar cũ
    if (oldAvatarS3Key) {
      const shouldDeleteOldAvatar = 
        (avatarS3Key !== undefined && avatarS3Key !== oldAvatarS3Key) || // Avatar mới khác avatar cũ
        (avatarS3Key === null && oldAvatarS3Key); // User muốn xóa avatar

      if (shouldDeleteOldAvatar) {
        try {
          await deleteFileFromS3(oldAvatarS3Key);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Không throw error, chỉ log để không block việc update profile
        }
      }
    }

    const updated = await updateUserProfile(userId, {
      fullName,
      phone,
      bio,
      avatar: avatarS3Key, // undefined = không update, null = xóa, string = update
    });

    // Trả về avatar URL (public URL từ S3)
    let avatarUrl = avatar || null;
    if (!avatarUrl && updated.avatar_s3_key) {
      // Nếu không có URL nhưng có S3 key, tạo URL từ S3 key
      avatarUrl = getS3Url(updated.avatar_s3_key);
    }

    return successResponse(res, {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name || '',
      phone: updated.phone || '',
      avatar: avatarUrl,
      avatarS3Key: updated.avatar_s3_key || null,
      bio: updated.bio || '',
    });
  } catch (err) {
    next(err);
  }
}
