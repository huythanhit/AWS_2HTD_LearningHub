// src/services/profileService.js
import apiClient from './https';

/**
 * Lấy thông tin profile của user hiện tại
 * API: GET /api/my/profile
 * @returns {Promise<Object>} { id, email, fullName, phone, avatar, avatarS3Key, bio, roleName }
 */
export async function getMyProfile() {
  try {
    const res = await apiClient.get('/api/my/profile');
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to fetch profile');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật thông tin profile của user hiện tại
 * API: PUT /api/my/profile
 * @param {Object} payload - { fullName?, phone?, bio?, avatar? }
 *   - Tất cả fields đều optional
 *   - avatar: URL từ API upload/image → update avatar mới
 *            "" hoặc null → xóa avatar
 *            Không gửi field này → giữ nguyên avatar hiện tại
 * @returns {Promise<Object>} Profile đã cập nhật
 */
export async function updateMyProfile(payload) {
  try {
    const res = await apiClient.put('/api/my/profile', payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to update profile');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload image (avatar hoặc image khác)
 * API: POST /api/upload/image
 * @param {File} file - File ảnh cần upload (image/jpeg, image/jpg, image/png, image/gif, image/webp)
 * @returns {Promise<Object>} { message, urls: [string], folder }
 */
export async function uploadImage(file) {
  if (!file) {
    throw new Error('File is required');
  }

  // Validate image file
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only image files are allowed');
  }

  // Validate file size (500MB = 500 * 1024 * 1024 bytes)
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 500MB limit');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiClient.post('/api/upload/image', formData);
    const result = res.data;

    // Response format: { message, urls: [...], folder }
    if (result && result.urls && result.urls.length > 0) {
      return result;
    }

    throw new Error(result.message || 'Upload failed');
  } catch (error) {
    // Handle specific error messages from backend
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

export default {
  getMyProfile,
  updateMyProfile,
  uploadImage,
};
