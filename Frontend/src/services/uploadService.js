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

  // Validate file object
  if (!(file instanceof File) && !(file instanceof Blob)) {
    console.error('[uploadLectureFile] Invalid file object:', {
      type: typeof file,
      constructor: file?.constructor?.name,
      file: file,
    });
    throw new Error('Invalid file: file must be a File or Blob object');
  }

  // Validate file size
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  // Validate file size limit (500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit of ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
  }

  // Log file info để debug
  console.log('[uploadLectureFile] Uploading file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    courseId: courseId,
  });

  // Tạo FormData và append file - QUAN TRỌNG: append file object trực tiếp, không modify
  const formData = new FormData();
  
  // Append file với tên field đúng ('file' như backend expect)
  formData.append('file', file, file.name); // Thêm filename để đảm bảo
  formData.append('courseId', courseId);

  // Validate FormData có file không
  if (!formData.has('file')) {
    throw new Error('Failed to append file to FormData');
  }

  try {
    // Không cần set headers, interceptor sẽ tự động xử lý FormData
    const res = await apiClient.post('/api/upload/lecture', formData, {
      // Đảm bảo timeout đủ lớn cho file lớn
      timeout: 300000, // 5 phút cho file lớn
      // Axios sẽ tự động set Content-Type với boundary cho FormData
      headers: {
        // KHÔNG set Content-Type ở đây, để browser tự động set với boundary
      },
    });

    const result = res.data;
    if (result && result.data) {
      console.log('[uploadLectureFile] Upload successful:', {
        s3Key: result.data.s3Key,
        url: result.data.url,
      });
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('[uploadLectureFile] Upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Upload avatar user (deprecated - use profileService.uploadImage instead)
 * @deprecated Sử dụng profileService.uploadImage() thay thế
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
    // Sử dụng endpoint mới /api/upload/image
    const res = await apiClient.post('/api/upload/image', formData);

    const result = res.data;
    // Response format mới: { message, urls: [...], folder }
    if (result && result.urls && result.urls.length > 0) {
      // Convert về format cũ để tương thích
      const url = result.urls[0];
      return {
        url: url,
        s3Key: url.split('/').pop() || '', // Extract key from URL
        filename: file.name,
        contentType: file.type,
        size: file.size
      };
    }
    throw new Error(result.message || 'Upload failed');
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
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

  // Validate file object
  if (!(file instanceof File) && !(file instanceof Blob)) {
    console.error('[uploadFlashcardFile] Invalid file object:', {
      type: typeof file,
      constructor: file?.constructor?.name,
    });
    throw new Error('Invalid file: file must be a File or Blob object');
  }

  // Validate file size
  if (file.size === 0) {
    throw new Error('File is empty');
  }

  // Log file info để debug
  console.log('[uploadFlashcardFile] Uploading file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    setId: setId,
  });

  const formData = new FormData();
  formData.append('file', file, file.name); // Thêm filename để đảm bảo
  formData.append('setId', setId);

  // Validate FormData có file không
  if (!formData.has('file')) {
    throw new Error('Failed to append file to FormData');
  }

  try {
    // Không cần set headers, interceptor sẽ tự động xử lý FormData
    const res = await apiClient.post('/api/upload/flashcard', formData, {
      timeout: 300000, // 5 phút cho file lớn
    });

    const result = res.data;
    if (result && result.data) {
      console.log('[uploadFlashcardFile] Upload successful:', {
        s3Key: result.data.s3Key,
        url: result.data.url,
      });
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('[uploadFlashcardFile] Upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
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
