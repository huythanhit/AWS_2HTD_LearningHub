// src/routes/test.routes.js

import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createQuestion,
  listMyQuestions,
  createExam,
  getExamDetail,
  startExamForStudent,
  submitExam,
  testMemberAccess,
} from "../controllers/test.controller.js";

const router = express.Router();

// Tất cả routes dưới đây yêu cầu đã đăng nhập
router.use(authMiddleware);

// ====== API TEST PHÂN QUYỀN ======
router.get("/member-test", requireRole("Member"), testMemberAccess);

// ====== Routes cho GIÁO VIÊN (Teacher, Admin) ======
router.post("/questions", requireRole("Teacher", "Admin"), createQuestion);
router.get("/questions", requireRole("Teacher", "Admin"), listMyQuestions);

router.post("/exams", requireRole("Teacher", "Admin"), createExam);
router.get("/exams/:id", requireRole("Teacher", "Admin"), getExamDetail);

// ====== Routes cho HỌC SINH (Member) làm bài ======
// Bạn có thể cho Teacher/Admin làm thử nên mình cho luôn vào list role
router.post(
  "/exams/:id/start",
  requireRole("Member", "Teacher", "Admin"),
  startExamForStudent
);

router.post(
  "/submissions/:id/submit",
  requireRole("Member", "Teacher", "Admin"),
  submitExam
);

export default router;
