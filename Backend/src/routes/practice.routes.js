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
  reviewPracticeCard
} from '../controllers/practice.controller.js';

const router = express.Router();

// Admin + Teacher: tạo / sửa set
router.post(
  '/',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateCreatePracticeSet,
  createPracticeSet
);

router.patch(
  '/:setId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateUpdatePracticeSet,
  updatePracticeSet
);

router.get(
  '/my',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  listMyPracticeSets
);

// Member cũng xem được list published
router.get('/', authMiddleware, listPublishedPracticeSets);

router.get('/:setId', authMiddleware, getPracticeSetDetail);

// Cards
router.post(
  '/:setId/cards',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateCreateCard,
  addCardToPracticeSet
);

router.patch(
  '/:setId/cards/:cardId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  validateUpdateCard,
  updatePracticeCard
);

router.delete(
  '/:setId/cards/:cardId',
  authMiddleware,
  requireRoles(['Admin', 'Teacher']),
  deletePracticeCard
);

// Study + review (Member, Teacher, Admin đều được)
router.get('/:setId/study', authMiddleware, getStudyCards);

router.post(
  '/:setId/cards/:cardId/review',
  authMiddleware,
  validateReview,
  reviewPracticeCard
);

export default router;
