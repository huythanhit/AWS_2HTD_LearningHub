// src/routes/test.routes.js

import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

import * as testController from '../controllers/test.controller.js';

const router = express.Router();

// helper
function requireAuth(...roles) {
  return [authMiddleware, requireRole(...roles)];
}

// =====================
// ADMIN / TEACHER
// =====================

// CÂU HỎI
router.post(
  '/questions',
  ...requireAuth('Teacher', 'Admin'),
  testController.createQuestion
);

router.get(
  '/questions',
  ...requireAuth('Teacher', 'Admin'),
  testController.listMyQuestions
);

router.get(
  '/questions/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.getQuestionDetail
);

router.put(
  '/questions/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.updateQuestion
);

router.delete(
  '/questions/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.deleteQuestion
);

// ĐỀ THI
router.post(
  '/exams',
  ...requireAuth('Teacher', 'Admin'),
  testController.createExam
);

router.get(
  '/exams',
  ...requireAuth('Teacher', 'Admin'),
  testController.listMyExams
);

router.get(
  '/exams/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.getExamDetail
);

router.put(
  '/exams/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.updateExam
);

router.patch(
  '/exams/:id/publish',
  ...requireAuth('Teacher', 'Admin'),
  testController.publishExam
);

router.delete(
  '/exams/:id',
  ...requireAuth('Teacher', 'Admin'),
  testController.deleteExam
);

// =====================
// MEMBER
// =====================

// Bắt đầu làm bài
router.post(
  '/exams/:id/start',
  ...requireAuth('Member'),
  testController.startExamForStudent
);

// Nộp bài
router.post(
  '/submissions/:id/submit',
  ...requireAuth('Member'),
  testController.submitExam
);

// Lịch sử bài làm của chính mình
router.get(
  '/my-submissions',
  ...requireAuth('Member'),
  testController.listMySubmissions
);

// Xem lại bài làm (Member xem bài của mình, GV/Admin xem bài của bất kỳ ai)
router.get(
  '/submissions/:id/review',
  authMiddleware,
  testController.reviewSubmission
);

// demo member-test (giữ nếu bạn cần)
router.get(
  '/member-test',
  ...requireAuth('Member'),
  testController.testMemberAccess
);

export default router;
