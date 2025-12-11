// src/controllers/upload.controller.js
// Controller để xử lý upload file lên S3

import multer from 'multer';
import { uploadFileToS3, deleteFileFromS3, generatePresignedDownloadUrl, generatePresignedUploadUrl } from '../services/s3.service.js';
import { getS3Key, getS3Url } from '../config/s3.js';

// Cấu hình multer để lưu file vào memory (không lưu vào disk)
const storage = multer.memoryStorage();

// Filter file types
const fileFilter = (req, file, cb) => {
  // Cho phép: images, videos, PDFs, audio
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska', // MKV
    'video/webm',
    'video/avi',
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
  ];

  // Nếu mimetype không có trong list nhưng bắt đầu bằng video/ hoặc image/, cho phép
  // (một số browser có thể gửi mimetype khác)
  if (allowedMimes.includes(file.mimetype) || 
      file.mimetype.startsWith('video/') || 
      file.mimetype.startsWith('image/')) {
    console.log('[fileFilter] Allowing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    cb(null, true);
  } else {
    console.warn('[fileFilter] File type not allowed:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// Upload config cho avatar: giới hạn nhỏ hơn (5MB)
const uploadAvatarConfig = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép images cho avatar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatar'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max cho avatar
  },
});

// Upload config cho các file khác: giới hạn lớn hơn (500MB)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// Middleware để upload single file (dùng cho lecture, flashcard, image)
export const uploadSingle = upload.single('file');

// Middleware để upload avatar (giới hạn 5MB)
export const uploadAvatarSingle = uploadAvatarConfig.single('file');

// Middleware để upload multiple files
export const uploadMultiple = upload.array('files', 10); // Max 10 files

/**
 * POST /api/upload/lecture
 * Upload file bài giảng (video, PDF, etc.)
 */
export const uploadLectureFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    // Validate file buffer
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      console.error('[uploadLectureFile] Invalid file buffer');
      return res.status(400).json({ message: 'Invalid file: buffer is corrupted' });
    }
    
    if (req.file.buffer.length === 0) {
      console.error('[uploadLectureFile] Empty file buffer');
      return res.status(400).json({ message: 'Invalid file: file is empty' });
    }
    
    // Validate video file magic bytes để đảm bảo file không bị corrupt
    const firstBytes = req.file.buffer.slice(0, Math.min(16, req.file.buffer.length));
    const isVideo = req.file.mimetype.startsWith('video/');
    
    // Log file info để debug
    console.log('[uploadLectureFile] File info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferSize: req.file.buffer.length,
      bufferType: Buffer.isBuffer(req.file.buffer) ? 'Buffer' : typeof req.file.buffer,
      firstBytes: firstBytes.toString('hex').substring(0, 32),
      courseId,
    });
    
    // Đảm bảo size khớp nhau - QUAN TRỌNG: size phải khớp chính xác
    if (req.file.size !== req.file.buffer.length) {
      console.error('[uploadLectureFile] CRITICAL: Size mismatch - file may be corrupted:', {
        declaredSize: req.file.size,
        bufferSize: req.file.buffer.length,
        difference: Math.abs(req.file.size - req.file.buffer.length),
      });
      return res.status(400).json({ 
        message: 'File upload failed: file size mismatch. Please try again.' 
      });
    }
    
    // Validate video file signature
    if (isVideo) {
      const videoSignatures = {
        'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
        'video/quicktime': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
        'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // EBML
      };
      
      const signature = Array.from(firstBytes.slice(0, 8));
      const expectedSig = videoSignatures[req.file.mimetype];
      
      if (expectedSig) {
        const isValid = expectedSig.every((byte, i) => signature[i] === byte);
        if (!isValid && req.file.buffer.length > 8) {
          console.warn('[uploadLectureFile] Video file signature may be invalid:', {
            contentType: req.file.mimetype,
            expected: expectedSig.map(b => '0x' + b.toString(16)).join(' '),
            actual: signature.slice(0, expectedSig.length).map(b => '0x' + b.toString(16)).join(' '),
          });
        }
      }
    }

    // Validate mimetype cho video
    if (req.file.mimetype.startsWith('video/')) {
      console.log('[uploadLectureFile] Uploading video file');
    }

    const prefix = `lectures/${courseId}`;
    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

    console.log('[uploadLectureFile] Upload successful:', {
      s3Key: result.key,
      url: result.url,
    });

    return res.status(200).json({
      message: 'File uploaded successfully',
      data: {
        s3Key: result.key,
        url: result.url,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error('uploadLectureFile error:', err);
    return res.status(500).json({
      message: 'Failed to upload file',
      error: err.message,
    });
  }
};

/**
 * POST /api/upload/avatar
 * Upload avatar user
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Chỉ cho phép image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    // Validate file buffer
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      console.error('[uploadAvatar] Invalid file buffer');
      return res.status(400).json({ message: 'Invalid file: buffer is corrupted' });
    }
    
    if (req.file.buffer.length === 0) {
      console.error('[uploadAvatar] Empty file buffer');
      return res.status(400).json({ message: 'Invalid file: file is empty' });
    }

    const prefix = 'avatars';
    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

    // Vì bucket đang public, dùng public URL trực tiếp
    // Không cần presigned URL
    console.log('[uploadAvatar] Avatar uploaded:', {
      s3Key: result.key,
      url: result.url,
    });

    return res.status(200).json({
      message: 'Avatar uploaded successfully',
      data: {
        s3Key: result.key,
        url: result.url, // Public URL cho bucket public
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    
    // Provide more helpful error messages for common AWS errors
    let errorMessage = err.message;
    if (err.message?.includes('Access Key Id')) {
      errorMessage = 'AWS credentials are invalid or missing. Please check your .env file and ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct.';
    } else if (err.message?.includes('InvalidAccessKeyId')) {
      errorMessage = 'AWS Access Key ID is invalid. Please verify your credentials in AWS IAM console.';
    } else if (err.message?.includes('SignatureDoesNotMatch')) {
      errorMessage = 'AWS Secret Access Key is incorrect. Please check your .env file.';
    } else if (err.message?.includes('credentials')) {
      errorMessage = 'AWS credentials are not configured. Please check your .env file.';
    }
    
    return res.status(500).json({
      message: 'Failed to upload avatar',
      error: errorMessage,
    });
  }
};

/**
 * POST /api/upload/flashcard
 * Upload file cho flashcard (image hoặc audio)
 */
export const uploadFlashcardFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Validate file buffer
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      console.error('[uploadFlashcardFile] Invalid file buffer');
      return res.status(400).json({ message: 'Invalid file: buffer is corrupted' });
    }
    
    if (req.file.buffer.length === 0) {
      console.error('[uploadFlashcardFile] Empty file buffer');
      return res.status(400).json({ message: 'Invalid file: file is empty' });
    }

    const { setId } = req.body;
    if (!setId) {
      return res.status(400).json({ message: 'setId is required' });
    }

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'audio';
    const prefix = `flashcards/${setId}/${fileType}`;

    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

    return res.status(200).json({
      message: 'Flashcard file uploaded successfully',
      data: {
        s3Key: result.key,
        url: result.url,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        fileType,
        size: req.file.size,
      },
    });
  } catch (err) {
    console.error('uploadFlashcardFile error:', err);
    return res.status(500).json({
      message: 'Failed to upload flashcard file',
      error: err.message,
    });
  }
};

/**
 * DELETE /api/upload/:s3Key
 * Delete file từ S3
 */
export const deleteFile = async (req, res) => {
  try {
    const { s3Key } = req.params;
    if (!s3Key) {
      return res.status(400).json({ message: 's3Key is required' });
    }

    await deleteFileFromS3(s3Key);

    return res.status(200).json({
      message: 'File deleted successfully',
    });
  } catch (err) {
    console.error('deleteFile error:', err);
    return res.status(500).json({
      message: 'Failed to delete file',
      error: err.message,
    });
  }
};

/**
 * POST /api/upload-image
 * Upload image đơn giản (tương tự API tham khảo)
 * Nhận binary file, trả về URL
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Validate file buffer
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      console.error('[uploadImage] Invalid file buffer');
      return res.status(400).json({ message: 'Invalid file: buffer is corrupted' });
    }
    
    if (req.file.buffer.length === 0) {
      console.error('[uploadImage] Empty file buffer');
      return res.status(400).json({ message: 'Invalid file: file is empty' });
    }

    // Chỉ cho phép image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    const prefix = 'uploads'; // Folder như API tham khảo
    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

    return res.status(200).json({
      message: 'Upload thành công',
      urls: [result.url],
      folder: prefix,
    });
  } catch (err) {
    console.error('uploadImage error:', err);
    
    // Provide more helpful error messages for common AWS errors
    let errorMessage = err.message;
    if (err.message?.includes('Access Key Id')) {
      errorMessage = 'AWS credentials are invalid or missing. Please check your .env file and ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct.';
    } else if (err.message?.includes('InvalidAccessKeyId')) {
      errorMessage = 'AWS Access Key ID is invalid. Please verify your credentials in AWS IAM console.';
    } else if (err.message?.includes('SignatureDoesNotMatch')) {
      errorMessage = 'AWS Secret Access Key is incorrect. Please check your .env file.';
    } else if (err.message?.includes('credentials')) {
      errorMessage = 'AWS credentials are not configured. Please check your .env file.';
    }
    
    return res.status(500).json({
      message: 'Failed to upload image',
      error: errorMessage,
    });
  }
};

/**
 * POST /api/upload/presigned-upload-url
 * Generate presigned URL để frontend upload trực tiếp lên S3
 * Body: { filename, contentType, prefix? }
 */
export const getPresignedUploadUrl = async (req, res) => {
  try {
    const { filename, contentType, prefix = 'avatars' } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        message: 'filename and contentType are required',
      });
    }

    // Validate content type cho avatar
    if (prefix === 'avatars' && !contentType.startsWith('image/')) {
      return res.status(400).json({
        message: 'Only image files are allowed for avatar',
      });
    }

    // Generate S3 key
    const s3Key = getS3Key(prefix, filename);

    // Generate presigned URL
    const presignedUrl = await generatePresignedUploadUrl(s3Key, contentType, 300); // 5 phút

    // Get public URL
    const publicUrl = getS3Url(s3Key);

    console.log('[getPresignedUploadUrl] Generated presigned URL for upload:', {
      s3Key,
      contentType,
      prefix,
    });

    return res.status(200).json({
      message: 'Presigned URL generated successfully',
      data: {
        s3Key,
        presignedUrl,
        publicUrl,
        expiresIn: 300, // 5 phút
      },
    });
  } catch (err) {
    console.error('getPresignedUploadUrl error:', err);
    return res.status(500).json({
      message: 'Failed to generate presigned upload URL',
      error: err.message,
    });
  }
};

/**
 * GET /api/upload/presigned/:s3Key
 * Generate presigned URL để download file private
 */
export const getPresignedUrl = async (req, res) => {
  try {
    let { s3Key } = req.params;
    if (!s3Key) {
      return res.status(400).json({ message: 's3Key is required' });
    }

    // Decode URI component nếu cần
    try {
      s3Key = decodeURIComponent(s3Key);
    } catch (e) {
      // Nếu decode fail thì dùng nguyên bản
      console.warn('Failed to decode s3Key, using original:', s3Key);
    }

    console.log('Generating presigned URL for s3Key:', s3Key);

    const expiresIn = parseInt(req.query.expiresIn) || 3600; // Default 1 hour

    const url = await generatePresignedDownloadUrl(s3Key, expiresIn);

    if (!url) {
      console.error('Failed to generate presigned URL for:', s3Key);
      return res.status(404).json({ message: 'File not found or cannot generate URL' });
    }

    console.log('Presigned URL generated successfully');
    return res.status(200).json({
      url,
      expiresIn,
    });
  } catch (err) {
    console.error('getPresignedUrl error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      name: err.name,
    });
    return res.status(500).json({
      message: 'Failed to generate presigned URL',
      error: err.message,
    });
  }
};

