// src/services/profileService.js
import apiClient from './https';

/**
 * Lấy thông tin profile của user hiện tại
 * @returns {Promise<Object>} { id, email, fullName, phone, avatar, bio, roleName }
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
 * @param {Object} payload - { fullName, phone, bio, avatar }
 * @returns {Promise<Object>} Profile đã cập nhật
 */
export async function updateMyProfile(payload) {
  try {
    const res = await apiClient.patch('/api/my/profile', payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || 'Failed to update profile');
    }

    return result.data || result;
  } catch (error) {
    throw error;
  }
}

export default {
  getMyProfile,
  updateMyProfile,
};
