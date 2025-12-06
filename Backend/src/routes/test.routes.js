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

// ===== ĐỀ THI =====
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

// ===== CÂU HỎI TRONG ĐỀ =====
router.post(
  '/exams/:examId/questions',
  ...requireAuth('Teacher', 'Admin'),
  testController.createQuestionInExam
);

router.get(
  '/exams/:examId/questions',
  ...requireAuth('Teacher', 'Admin'),
  testController.listQuestionsInExam
);

router.get(
  '/exams/:examId/questions/:questionId',
  ...requireAuth('Teacher', 'Admin'),
  testController.getQuestionInExamDetail
);

router.put(
  '/exams/:examId/questions/:questionId',
  ...requireAuth('Teacher', 'Admin'),
  testController.updateQuestionInExam
);

router.delete(
  '/exams/:examId/questions/:questionId',
  ...requireAuth('Teacher', 'Admin'),
  testController.deleteQuestionInExam
);

// =====================
// MEMBER
// =====================

// (MỚI) List các exam đã publish để Member thấy / làm
router.get(
  '/public-exams',
  ...requireAuth('Member'),
  testController.listPublicExamsForMember
);

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
