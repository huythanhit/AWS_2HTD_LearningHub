// src/routes/course.routes.js
// Routes cho quản lý courses

import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";

const router = express.Router();

// Tất cả routes yêu cầu đã đăng nhập
router.use(authMiddleware);

// GET /api/courses - Lấy danh sách courses (Admin và Teacher có thể xem)
router.get("/", requireRole("Admin", "Teacher"), getCourses);

// GET /api/courses/:id - Lấy chi tiết course (Admin và Teacher có thể xem)
router.get("/:id", requireRole("Admin", "Teacher"), getCourseById);

// POST /api/courses - Tạo course mới (Admin và Teacher)
router.post("/", requireRole("Admin", "Teacher"), createCourse);

// PUT /api/courses/:id - Cập nhật course (Admin và Teacher)
router.put("/:id", requireRole("Admin", "Teacher"), updateCourse);

// DELETE /api/courses/:id - Xóa course (chỉ Admin)
router.delete("/:id", requireRole("Admin"), deleteCourse);

export default router;
