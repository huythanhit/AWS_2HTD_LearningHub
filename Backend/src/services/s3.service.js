// src/services/s3.service.js
// Service để upload, delete, và generate presigned URL cho S3

import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME, getS3Key, getS3Url } from '../config/s3.js';

/**
 * Upload file lên S3
 * @param {Buffer|Stream} fileBuffer - File buffer hoặc stream
 * @param {string} prefix - Prefix cho S3 key (vd: 'lectures', 'avatars', 'flashcards')
 * @param {string} filename - Tên file gốc
 * @param {string} contentType - MIME type (vd: 'video/mp4', 'image/png')
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadFileToS3(fileBuffer, prefix, filename, contentType) {
  const key = getS3Key(prefix, filename);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // Không dùng ACL vì bucket đang ở chế độ "Bucket owner enforced"
    // File sẽ public nhờ Bucket Policy đã cấu hình
  });

  await s3Client.send(command);

  return {
    key,
    url: getS3Url(key),
  };
}

/**
 * Delete file từ S3
 * @param {string} key - S3 key cần xóa
 * @returns {Promise<void>}
 */
export async function deleteFileFromS3(key) {
  if (!key) return;

  // Loại bỏ URL prefix nếu có
  const cleanKey = key.replace(/^https?:\/\/.*?\//, '');

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: cleanKey,
  });

  await s3Client.send(command);
}

/**
 * Generate presigned URL để frontend upload trực tiếp lên S3 (nếu cần)
 * @param {string} key - S3 key
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - Thời gian hết hạn (giây), default 3600 (1 giờ)
 * @returns {Promise<string>} Presigned URL
 */
export async function generatePresignedUploadUrl(
  key,
  contentType,
  expiresIn = 3600
) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Generate presigned URL để download file private từ S3
 * @param {string} key - S3 key
 * @param {number} expiresIn - Thời gian hết hạn (giây), default 3600 (1 giờ)
 * @returns {Promise<string>} Presigned URL
 */
export async function generatePresignedDownloadUrl(key, expiresIn = 3600) {
  if (!key) return null;

  const cleanKey = key.replace(/^https?:\/\/.*?\//, '');

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: cleanKey,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Helper: Lấy S3 key từ URL hoặc key
 * @param {string} urlOrKey - S3 URL hoặc key
 * @returns {string} S3 key
 */
export function extractS3Key(urlOrKey) {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    // Extract key from URL
    const url = new URL(urlOrKey);
    return url.pathname.substring(1); // Remove leading slash
  }
  return urlOrKey;
}

