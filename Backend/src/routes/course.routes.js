// src/routes/course.routes.js
import { Router } from "express";
import {
  getAdminCourses,
  getAdminCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createLecture,
  updateLecture,
  deleteLecture,
  getCourseLectures,
  getPublishedCourses,          
  getCourseDetail,
  enrollCourse,
  updateLectureProgress,
  getMyCourses,
  assignTeacherToCourse,
  removeTeacherFromCourse,
  getTeacherCourses,
  getLecturesByTeacherInCourse,
} from "../controllers/course.controller.js";


import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// =============== ADMIN / TEACHER ===============

// Danh sách course (Admin: all, Teacher: của mình tạo)
router.get("/admin/courses", authMiddleware, getAdminCourses);

// Chi tiết 1 course (Admin / Teacher)
router.get("/admin/courses/:courseId", authMiddleware, getAdminCourseById
);

// Tạo course (Admin / Teacher)
router.post("/admin/courses", authMiddleware, createCourse);

// Sửa course
router.patch("/admin/courses/:courseId", authMiddleware, updateCourse);

// Xoá course
router.delete("/admin/courses/:courseId", authMiddleware, deleteCourse);

// Admin gán / bỏ gán Teacher cho course
router.post(
  "/admin/courses/:courseId/teachers",
  authMiddleware,
  assignTeacherToCourse
);

router.delete(
  "/admin/courses/:courseId/teachers/:teacherId",
  authMiddleware,
  removeTeacherFromCourse
);

// Lấy danh sách lecture của 1 course
router.get(
  "/admin/courses/:courseId/lectures",
  authMiddleware,
  getCourseLectures
);

// Tạo lecture
router.post(
  "/admin/courses/:courseId/lectures",
  authMiddleware,
  createLecture
);

// Sửa lecture
router.patch(
  "/admin/courses/:courseId/lectures/:lectureId",
  authMiddleware,
  updateLecture
);

// Xoá lecture
router.delete(
  "/admin/courses/:courseId/lectures/:lectureId",
  authMiddleware,
  deleteLecture
);

// Admin xem danh sách bài giảng của 1 teacher trong 1 khóa
router.get(
  "/admin/teachers/:teacherId/courses/:courseId/lectures",
  authMiddleware,
  getLecturesByTeacherInCourse
);

// =============== TEACHER ===============

// Teacher lấy list course mình dạy (được gán)
router.get("/teacher/courses", authMiddleware, getTeacherCourses);

// =============== PUBLIC / MEMBER ===============

// PUBLIC / MEMBER – danh sách khoá học public
router.get("/courses", getPublishedCourses);

// Chi tiết 1 course
router.get("/courses/:courseId", getCourseDetail);

// Member enroll course
router.post(
  "/courses/:courseId/enroll",
  authMiddleware,
  enrollCourse
);

// Member update progress lecture
router.post(
  "/courses/:courseId/lectures/:lectureId/progress",
  authMiddleware,
  updateLectureProgress
);


// My courses
router.get("/my/courses", authMiddleware, getMyCourses);

export default router;
