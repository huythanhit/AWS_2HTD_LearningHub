// src/routes/upload.routes.js
import { Router } from 'express';
import {
  uploadSingle,
  uploadAvatarSingle,
  uploadMultiple,
  uploadAvatar,
  uploadFlashcardFile,
  uploadImage,
  deleteFile,
  getPresignedUrl,
  getPresignedUploadUrl,
} from '../controllers/upload.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Upload avatar (dùng uploadAvatarSingle với giới hạn 5MB)
router.post('/avatar', uploadAvatarSingle, uploadAvatar);

// Upload file flashcard
router.post('/flashcard', uploadSingle, uploadFlashcardFile);

// Upload image (theo format code mẫu)
router.post('/image', uploadSingle, uploadImage);

// Delete file
router.delete('/:s3Key', deleteFile);

// Get presigned URL để download file private
router.get('/presigned/:s3Key', getPresignedUrl);

// Get presigned URL để upload file trực tiếp lên S3
router.post('/presigned-upload-url', getPresignedUploadUrl);

export default router;

