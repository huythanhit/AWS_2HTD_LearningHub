// src/routes/practice.routes.js
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import {
  validateCreatePracticeSet,
  validateUpdatePracticeSet,
  validateCreateCard,
  validateUpdateCard,
  validateReview
} from '../validators/practice.validator.js';
import {
  createPracticeSet,
  updatePracticeSet,
  listMyPracticeSets,
  listPublishedPracticeSets,
  getPracticeSetDetail,
  addCardToPracticeSet,
  updatePracticeCard,
  deletePracticeCard,
  getStudyCards,
  reviewPracticeCard,
  deletePracticeSet,
  publishPracticeSet,
  listPracticeCardsInSet,
  getPracticeCardDetail,
  getTeacherPracticeSetDetail 
} from '../controllers/practice.controller.js';

const router = express.Router();

// =========================
// QUIZ (PRACTICE SET) – ADMIN/TEACHER
// =========================

// Tạo quiz
router.post(
  '/',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateCreatePracticeSet,
  createPracticeSet
);

// Sửa quiz (meta: title, desc, category, topic, language, courseId)
router.patch(
  '/:setId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateUpdatePracticeSet,
  updatePracticeSet
);

// Xoá quiz
router.delete(
  '/:setId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  deletePracticeSet
);

// Publish / unpublish quiz
router.patch(
  '/:setId/publish',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  publishPracticeSet
);

// List quiz của chính mình
router.get(
  '/my',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  listMyPracticeSets
);

// =========================
// QUIZ – PUBLIC / MEMBER
// =========================

// Member xem list quiz đã publish
router.get('/', authMiddleware, listPublishedPracticeSets);

// Chi tiết 1 quiz (kèm cards)
router.get('/:setId', authMiddleware, getPracticeSetDetail);

// =========================
// CARDS TRONG QUIZ – ADMIN/TEACHER
// =========================

// Tạo card trong quiz
router.post(
  '/:setId/cards',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateCreateCard,
  addCardToPracticeSet
);

// List toàn bộ cards trong quiz (cho màn editor)
router.get(
  '/:setId/cards',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  listPracticeCardsInSet
);

// Chi tiết 1 card trong quiz
router.get(
  '/:setId/cards/:cardId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  getPracticeCardDetail
);

// Sửa card
router.patch(
  '/:setId/cards/:cardId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateUpdateCard,
  updatePracticeCard
);

// Xoá card
router.delete(
  '/:setId/cards/:cardId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  deletePracticeCard
);

// Chi tiết quiz cho giáo viên (thấy được cả chưa publish, nếu là owner/Admin)
router.get(
  '/teacher/:setId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  getTeacherPracticeSetDetail
);

// =========================
// STUDY + REVIEW (Member + Teacher + Admin)
// =========================

// Lấy list cards để ôn (SM-2)
router.get('/:setId/study', authMiddleware, getStudyCards);

// Gửi kết quả ôn của 1 card
router.post(
  '/:setId/cards/:cardId/review',
  authMiddleware,
  validateReview,
  reviewPracticeCard
);

export default router;
