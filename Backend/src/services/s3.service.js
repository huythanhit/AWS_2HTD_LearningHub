// src/services/s3.service.js
// Service để upload, delete, và generate presigned URL cho S3

import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
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
  // Validate buffer
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer: buffer is required and must be a Buffer');
  }
  
  if (fileBuffer.length === 0) {
    throw new Error('Invalid file buffer: buffer is empty');
  }

  const key = getS3Key(prefix, filename);

  // Normalize Content-Type: đảm bảo đúng format
  // QUAN TRỌNG: KHÔNG thay đổi ContentType tùy tiện vì có thể làm file không mở được
  // Giữ nguyên ContentType từ client để đảm bảo file được lưu đúng định dạng
  let normalizedContentType = contentType || 'application/octet-stream';
  
  // Chỉ normalize các trường hợp thực sự cần thiết, không thay đổi định dạng file
  // Video/quicktime và video/x-msvideo là các định dạng hợp lệ, không nên thay đổi
  // Nếu cần, có thể thêm vào whitelist nhưng không thay đổi thành format khác

  // Metadata cho video streaming
  // Trong AWS SDK v3, CacheControl và ContentDisposition là properties trực tiếp
  let cacheControl = undefined;
  let contentDisposition = undefined;
  
  if (normalizedContentType.startsWith('video/')) {
    // Video cần Cache-Control và Content-Disposition để browser có thể stream
    // S3 tự động hỗ trợ Accept-Ranges: bytes cho video streaming
    cacheControl = 'public, max-age=31536000, immutable'; // Cache 1 năm
    contentDisposition = 'inline'; // Cho phép play trực tiếp trong browser
  } else if (normalizedContentType.startsWith('image/')) {
    cacheControl = 'public, max-age=31536000, immutable';
  } else if (normalizedContentType === 'application/pdf') {
    cacheControl = 'public, max-age=86400'; // Cache 1 ngày cho PDF
    contentDisposition = 'inline';
  }

  // QUAN TRỌNG: Dùng trực tiếp buffer từ multer, không tạo copy
  // Buffer.from() có thể gây vấn đề với binary data
  // Multer đã cung cấp buffer sẵn, chỉ cần dùng trực tiếp
  // Đảm bảo không có encoding nào được áp dụng
  
  const commandParams = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer, // Dùng trực tiếp buffer từ multer
    ContentType: normalizedContentType,
    // KHÔNG set ContentEncoding để đảm bảo binary data giữ nguyên
    // S3 sẽ tự động xử lý binary data đúng cách
  };

  // Chỉ thêm metadata nếu có
  if (cacheControl) {
    commandParams.CacheControl = cacheControl;
  }
  if (contentDisposition) {
    commandParams.ContentDisposition = contentDisposition;
  }

  // Validate buffer integrity - kiểm tra magic bytes để đảm bảo file không bị corrupt
  const bufferSize = fileBuffer.length;
  const firstBytes = fileBuffer.slice(0, Math.min(16, bufferSize));
  const lastBytes = fileBuffer.slice(Math.max(0, bufferSize - 16), bufferSize);
  
  // Validate video file signature (magic bytes)
  if (normalizedContentType.startsWith('video/')) {
    const videoSignatures = {
      'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // MP4: ftyp
      'video/quicktime': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // QuickTime: ftyp
      'video/x-msvideo': [0x52, 0x49, 0x46, 0x46], // AVI: RIFF
      'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // WebM: EBML
    };
    
    const signature = Array.from(firstBytes.slice(0, 8));
    // MP4 có thể bắt đầu ở offset khác nhau, kiểm tra trong 12 bytes đầu
    const isValidVideo = Object.values(videoSignatures).some(sig => {
      // Tìm signature trong 12 bytes đầu (MP4 có thể có offset)
      for (let offset = 0; offset <= 4; offset++) {
        if (signature.length >= sig.length + offset) {
          const matches = sig.every((byte, i) => signature[i + offset] === byte);
          if (matches) return true;
        }
      }
      return false;
    });
    
    if (!isValidVideo && bufferSize > 8) {
      console.warn('[uploadFileToS3] Video file signature check failed:', {
        contentType: normalizedContentType,
        firstBytes: firstBytes.toString('hex'),
      });
      // Không fail upload vì một số video có thể có format khác
    }
  }
  
  console.log('[uploadFileToS3] Uploading file:', {
    key,
    prefix,
    filename,
    contentType: normalizedContentType,
    size: bufferSize,
    cacheControl,
    contentDisposition,
    bufferInfo: {
      isBuffer: Buffer.isBuffer(fileBuffer),
      length: bufferSize,
      firstBytes: firstBytes.toString('hex').substring(0, 32),
      lastBytes: lastBytes.toString('hex').substring(0, 32),
    },
  });

  const command = new PutObjectCommand(commandParams);

  await s3Client.send(command);

  // Verify file đã upload đúng bằng cách kiểm tra metadata và magic bytes
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    const headResult = await s3Client.send(headCommand);
    
    // Verify size và content-type
    if (headResult.ContentLength !== bufferSize) {
      console.error('[uploadFileToS3] CRITICAL: Uploaded file size mismatch:', {
        originalSize: bufferSize,
        s3Size: headResult.ContentLength,
        difference: Math.abs(bufferSize - headResult.ContentLength),
      });
      throw new Error('File size mismatch after upload - file may be corrupted');
    }
    
    if (headResult.ContentType !== normalizedContentType) {
      console.warn('[uploadFileToS3] Content-Type mismatch:', {
        expected: normalizedContentType,
        actual: headResult.ContentType,
      });
    }
    
    // Verify magic bytes: Download first 32 bytes từ S3 và so sánh với buffer gốc
    if (normalizedContentType.startsWith('video/') || normalizedContentType.startsWith('image/')) {
      try {
        const getObjectCommand = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
          Range: 'bytes=0-31', // Chỉ lấy 32 bytes đầu để verify
        });
        const s3Object = await s3Client.send(getObjectCommand);
        
        // Convert stream to buffer
        const chunks = [];
        const bodyStream = s3Object.Body;
        // Handle both Readable stream and Uint8Array
        if (bodyStream instanceof Readable || typeof bodyStream[Symbol.asyncIterator] === 'function') {
          for await (const chunk of bodyStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        } else {
          // Body might already be a buffer
          chunks.push(Buffer.isBuffer(bodyStream) ? bodyStream : Buffer.from(bodyStream));
        }
        const s3FirstBytes = Buffer.concat(chunks);
        
        // So sánh magic bytes
        const originalFirstBytes = fileBuffer.slice(0, Math.min(32, fileBuffer.length));
        const bytesMatch = originalFirstBytes.equals(s3FirstBytes.slice(0, originalFirstBytes.length));
        
        if (!bytesMatch) {
          console.error('[uploadFileToS3] CRITICAL: Magic bytes mismatch - file corrupted during upload!', {
            original: originalFirstBytes.toString('hex'),
            s3: s3FirstBytes.toString('hex'),
          });
          throw new Error('File corrupted during upload - magic bytes do not match');
        }
        
        console.log('[uploadFileToS3] Magic bytes verification passed');
      } catch (verifyBytesError) {
        // Nếu verify bytes fail, log error nhưng không fail upload (có thể là S3 chưa ready)
        console.error('[uploadFileToS3] Error verifying magic bytes:', verifyBytesError.message);
      }
    }
    
    console.log('[uploadFileToS3] File uploaded and verified successfully:', {
      key,
      url: getS3Url(key),
      s3Size: headResult.ContentLength,
      s3ContentType: headResult.ContentType,
      s3ETag: headResult.ETag,
    });
  } catch (verifyError) {
    console.error('[uploadFileToS3] Error verifying uploaded file:', verifyError);
    // Throw error nếu là size mismatch hoặc magic bytes mismatch
    if (verifyError.message.includes('mismatch') || verifyError.message.includes('corrupted')) {
      throw verifyError;
    }
  }

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
  if (!key) {
    console.error('generatePresignedDownloadUrl: key is required');
    return null;
  }

  // Clean key: remove full URL prefix nếu có
  let cleanKey = key.replace(/^https?:\/\/.*?\//, '');
  // Remove query string nếu có
  cleanKey = cleanKey.split('?')[0];
  // Trim whitespace
  cleanKey = cleanKey.trim();

  console.log('Generating presigned URL:', {
    originalKey: key,
    cleanKey: cleanKey,
    bucket: S3_BUCKET_NAME,
    expiresIn,
  });

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: cleanKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('Presigned URL generated successfully');
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', {
      error: error.message,
      code: error.code,
      key: cleanKey,
    });
    throw error;
  }
}

/**
 * Helper: Lấy S3 key từ URL hoặc key
 * @param {string} urlOrKey - S3 URL hoặc key
 * @returns {string} S3 key
 */
export function extractS3Key(urlOrKey) {
  if (!urlOrKey) return null;
  
  // Nếu đã là key (không có http/https), return luôn
  if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }
  
  try {
    // Extract key from URL
    const url = new URL(urlOrKey);
    let key = url.pathname.substring(1); // Remove leading slash
    
    // Remove query string nếu có (presigned URL có query params)
    if (key.includes('?')) {
      key = key.split('?')[0];
    }
    
    // Decode URL encoding nếu có
    key = decodeURIComponent(key);
    
    console.log('[extractS3Key] Extracted:', {
      original: urlOrKey,
      pathname: url.pathname,
      extracted: key,
    });
    
    return key;
  } catch (err) {
    console.error('[extractS3Key] Error parsing URL:', err);
    // Fallback: try to extract manually
    const match = urlOrKey.match(/\/[^?]+/);
    if (match) {
      return match[0].substring(1); // Remove leading slash
    }
    return urlOrKey;
  }
}

