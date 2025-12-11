// src/controllers/upload.controller.js
// Controller để xử lý upload file lên S3

import multer from 'multer';
import { uploadFileToS3, deleteFileFromS3, generatePresignedDownloadUrl } from '../services/s3.service.js';

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
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// Middleware để upload single file
export const uploadSingle = upload.single('file');

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

    const prefix = `lectures/${courseId}`;
    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

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

    const prefix = 'avatars';
    const result = await uploadFileToS3(
      req.file.buffer,
      prefix,
      req.file.originalname,
      req.file.mimetype
    );

    // Tạo presigned URL cho private bucket (thay vì public URL)
    let presignedUrl = null;
    try {
      presignedUrl = await generatePresignedDownloadUrl(result.key, 3600); // 1 giờ
    } catch (s3Error) {
      console.error('Error generating presigned URL for avatar:', s3Error);
      // Fallback về public URL nếu không tạo được presigned URL
      presignedUrl = result.url;
    }

    return res.status(200).json({
      message: 'Avatar uploaded successfully',
      data: {
        s3Key: result.key,
        url: presignedUrl || result.url, // Trả về presigned URL cho private bucket
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

