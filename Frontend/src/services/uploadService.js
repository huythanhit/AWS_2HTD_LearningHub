// src/services/uploadService.js
// Service để upload file lên S3 thông qua backend

import apiClient from './https';

/**
 * Upload file bài giảng (video, PDF, etc.)
 * @param {File} file - File cần upload
 * @param {string} courseId - ID của khóa học
 * @returns {Promise<{s3Key: string, url: string, filename: string, contentType: string, size: number}>}
 */
export async function uploadLectureFile(file, courseId) {
  if (!file) {
    throw new Error('File is required');
  }
  if (!courseId) {
    throw new Error('courseId is required');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('courseId', courseId);

  try {
    const res = await apiClient.post('/api/upload/lecture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = res.data;
    if (result && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload avatar user
 * @param {File} file - File ảnh avatar
 * @returns {Promise<{s3Key: string, url: string, filename: string, contentType: string, size: number}>}
 */
export async function uploadAvatar(file) {
  if (!file) {
    throw new Error('File is required');
  }

  // Validate image file
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiClient.post('/api/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = res.data;
    if (result && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload file cho flashcard (image hoặc audio)
 * @param {File} file - File cần upload
 * @param {string} setId - ID của practice set
 * @returns {Promise<{s3Key: string, url: string, filename: string, contentType: string, fileType: string, size: number}>}
 */
export async function uploadFlashcardFile(file, setId) {
  if (!file) {
    throw new Error('File is required');
  }
  if (!setId) {
    throw new Error('setId is required');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('setId', setId);

  try {
    const res = await apiClient.post('/api/upload/flashcard', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = res.data;
    if (result && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa file từ S3
 * @param {string} s3Key - S3 key của file cần xóa
 * @returns {Promise<void>}
 */
export async function deleteFile(s3Key) {
  if (!s3Key) {
    throw new Error('s3Key is required');
  }

  try {
    await apiClient.delete(`/api/upload/${encodeURIComponent(s3Key)}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy presigned URL để download file private
 * @param {string} s3Key - S3 key của file
 * @param {number} expiresIn - Thời gian hết hạn (giây), default 3600
 * @returns {Promise<{url: string, expiresIn: number}>}
 */
export async function getPresignedUrl(s3Key, expiresIn = 3600) {
  if (!s3Key) {
    throw new Error('s3Key is required');
  }

  try {
    const res = await apiClient.get(`/api/upload/presigned/${encodeURIComponent(s3Key)}`, {
      params: { expiresIn },
    });

    return res.data;
  } catch (error) {
    throw error;
  }
}

export default {
  uploadLectureFile,
  uploadAvatar,
  uploadFlashcardFile,
  deleteFile,
  getPresignedUrl,
};
