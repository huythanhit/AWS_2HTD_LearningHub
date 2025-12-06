// src/controllers/course.controller.js
import {
  getAdminCoursesService,
  getCourseByIdService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
  createLectureService,
  updateLectureService,
  deleteLectureService,
  getCourseLecturesService,
  getPublishedCoursesService,
  getCourseDetailService,
  enrollCourseService,
  updateLectureProgressService,
  getMyCoursesService,
  addTeacherToCourseService,
  removeTeacherFromCourseService,
  getTeacherCoursesService,
  getLecturesByTeacherInCourseService,
  isTeacherOfCourseService,
} from "../services/course.service.js";

// ===== Helpers: lấy userId & roleId từ req.user =====
// auth.middleware.js đang set: { sub, email, groups, roleName, roleId, localUserId, ... }
const getUserId = (user) =>
  user?.localUserId || user?.id || user?.userId || user?.user_id || null;

const getRoleId = (user) =>
  user?.roleId ?? user?.role_id ?? user?.role ?? null;

const isAdmin = (user) => getRoleId(user) === 4;
const isTeacher = (user) => getRoleId(user) === 3;
const isAdminOrTeacher = (user) => isAdmin(user) || isTeacher(user);

// ================== ADMIN / TEACHER ==================

// GET /api/admin/courses
export const getAdminCourses = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const courses = await getAdminCoursesService(userId, isAdmin(user));
    return res.status(200).json(courses);
  } catch (err) {
    console.error("getAdminCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/courses/:courseId
export const getAdminCourseById = async (req, res) => {
  try {
    const user = req.user;

    // Chỉ Admin / Teacher mới được gọi API này
    if (!user || !isAdminOrTeacher(user)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;

    // Lấy course (đã có teachers vì bạn sửa getCourseByIdService rồi)
    const course = await getCourseByIdService(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check quyền: Admin OK, Teacher phải là creator hoặc được gán vào course
    const allowed = await canManageCourseContent(user, course, userId);
    if (!allowed) {
      return res.status(403).json({
        message:
          "Forbidden: chỉ Admin hoặc Teacher của khóa học mới được xem chi tiết",
      });
    }

    return res.status(200).json(course);
  } catch (err) {
    console.error("getAdminCourseById error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/admin/courses
export const createCourse = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const payload = req.body;

    if (!payload.slug || !payload.title) {
      return res
        .status(400)
        .json({ message: "slug và title là bắt buộc" });
    }

    const course = await createCourseService(userId, payload);
    return res.status(201).json({
      message: "Course created",
      course,
    });
  } catch (err) {
    console.error("createCourse error:", err);

    if (
      err?.originalError?.info?.number === 2627 ||
      err?.originalError?.info?.number === 2601
    ) {
      return res
        .status(400)
        .json({ message: "Slug đã tồn tại, hãy chọn slug khác" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/courses/:courseId
export const updateCourse = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;
    const payload = req.body;

    const existing = await getCourseByIdService(courseId);
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Teacher chỉ được sửa course mình tạo
    if (!isAdmin(user) && existing.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được sửa" });
    }

    const merged = {
      slug: payload.slug ?? existing.slug,
      title: payload.title ?? existing.title,
      shortDescription:
        payload.shortDescription ?? existing.shortDescription,
      description: payload.description ?? existing.description,
      price:
        payload.price !== undefined ? payload.price : existing.price,
      currency: payload.currency ?? existing.currency,
      published:
        payload.published !== undefined
          ? payload.published
          : existing.published,
      publishedAt: existing.publishedAt,
    };

    if (payload.published === true && !existing.published) {
      merged.publishedAt = new Date();
    } else if (payload.published === false && existing.published) {
      merged.publishedAt = null;
    }

    const updated = await updateCourseService(courseId, merged);
    if (!updated) {
      return res.status(500).json({ message: "Update course failed" });
    }

    return res.status(200).json({
      message: "Course updated",
      course: updated,
    });
  } catch (err) {
    console.error("updateCourse error:", err);
    // Lỗi trùng UNIQUE KEY (2627 / 2601)
    if (err.number === 2627 || err.number === 2601) {
    return res.status(400).json({
      message: "Slug đã tồn tại, hãy chọn slug khác.",
    });
  }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/courses/:courseId
export const deleteCourse = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;

    const existing = await getCourseByIdService(courseId);
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isAdmin(user) && existing.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được xoá" });
    }

    const rowsDeleted = await deleteCourseService(courseId);
    if (rowsDeleted === 0) {
      return res.status(500).json({ message: "Delete course failed" });
    }

    return res.status(200).json({
      message: "Course deleted",
      courseId,
    });
  } catch (err) {
    console.error("deleteCourse error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ========== ADMIN: Gán / bỏ gán Teacher cho Course ==========

// POST /api/admin/courses/:courseId/teachers
export const assignTeacherToCourse = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    const { courseId } = req.params;
    const { teacherId } = req.body;

    // ... các validate khác nếu có

    const assignment = await addTeacherToCourseService(courseId, teacherId);

    return res.status(201).json({
      message: "Teacher assigned to course",
      assignment,
    });
  } catch (err) {
    console.error("assignTeacherToCourse error:", err);

    // Nếu service ném lỗi 400 (course đã có teacher)
    if (err.statusCode === 400) {
      return res.status(400).json({
        message: err.message,
        currentTeacherId: err.currentTeacherId,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};


// DELETE /api/admin/courses/:courseId/teachers/:teacherId
export const removeTeacherFromCourse = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    const { courseId, teacherId } = req.params;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const rowsDeleted = await removeTeacherFromCourseService(
      courseId,
      teacherId
    );

    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: "Teacher is not assigned to this course" });
    }

    return res.status(200).json({
      message: "Teacher removed from course",
      courseId,
      teacherId,
    });
  } catch (err) {
    console.error("removeTeacherFromCourse error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ========== TEACHER: Lấy list course mình dạy ==========

// GET /api/teacher/courses
export const getTeacherCourses = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Teacher only" });
    }

    const teacherId = getUserId(user);
    if (!teacherId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const courses = await getTeacherCoursesService(teacherId);
    return res.status(200).json(courses);
  } catch (err) {
    console.error("getTeacherCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ========== LECTURES (Admin + Teacher) ==========

// helper: check user có quyền quản lý nội dung course không
const canManageCourseContent = async (user, course, userId) => {
  if (!user || !course || !userId) return false;

  // Admin luôn được phép
  if (isAdmin(user)) return true;

  // Teacher: được phép nếu là creator hoặc được gán trong course_teachers
  if (isTeacher(user)) {
    if (course.creatorId === userId) return true;

    const isTeacherOfCourse = await isTeacherOfCourseService(
      course.courseId || course.id,
      userId
    );
    if (isTeacherOfCourse) return true;
  }

  return false;
};

// GET /api/admin/courses/:courseId/lectures
export const getCourseLectures = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allowed = await canManageCourseContent(user, existingCourse, userId);
    if (!allowed) {
      return res.status(403).json({
        message:
          "Forbidden: chỉ Admin hoặc Teacher được gán vào course mới xem danh sách lecture",
      });
    }

    const lectures = await getCourseLecturesService(courseId);
    return res.status(200).json(lectures);
  } catch (err) {
    console.error("getCourseLectures error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/admin/courses/:courseId/lectures
export const createLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;
    const payload = req.body;

    if (!payload.title) {
      return res
        .status(400)
        .json({ message: "title của lecture là bắt buộc" });
    }

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allowed = await canManageCourseContent(
      user,
      existingCourse,
      userId
    );
    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden: chỉ Admin hoặc Teacher được gán vào course mới thêm lecture",
      });
    }

    const lecture = await createLectureService(courseId, payload);
    return res.status(201).json({
      message: "Lecture created",
      lecture,
    });
  } catch (err) {
    console.error("createLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/courses/:courseId/lectures/:lectureId
export const updateLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId, lectureId } = req.params;
    const payload = req.body;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allowed = await canManageCourseContent(
      user,
      existingCourse,
      userId
    );
    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden: chỉ Admin hoặc Teacher được gán vào course mới sửa lecture",
      });
    }

    const lecture = await updateLectureService(courseId, lectureId, payload);
    if (!lecture) {
      return res
        .status(404)
        .json({ message: "Lecture not found in this course" });
    }

    return res.status(200).json({
      message: "Lecture updated",
      lecture,
    });
  } catch (err) {
    console.error("updateLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/courses/:courseId/lectures/:lectureId
export const deleteLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId, lectureId } = req.params;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const allowed = await canManageCourseContent(
      user,
      existingCourse,
      userId
    );
    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden: chỉ Admin hoặc Teacher được gán vào course mới xoá lecture",
      });
    }

    const rowsDeleted = await deleteLectureService(courseId, lectureId);
    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: "Lecture not found in this course" });
    }

    return res.status(200).json({
      message: "Lecture deleted",
      lectureId,
    });
  } catch (err) {
    console.error("deleteLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================== PUBLIC / MEMBER ==================

// GET /api/courses
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await getPublishedCoursesService();
    return res.status(200).json(courses);
  } catch (err) {
    console.error("getPublishedCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/courses/:courseId
export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await getCourseDetailService(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or not published" });
    }
    return res.status(200).json(course);
  } catch (err) {
    console.error("getCourseDetail error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/courses/:courseId/enroll
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = getUserId(req.user);

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const result = await enrollCourseService(userId, courseId);
    if (result.alreadyEnrolled) {
      return res.status(200).json({
        message: "Already enrolled",
        enrollment: result.enrollment,
      });
    }

    return res.status(201).json({
      message: "Enroll success",
      enrollment: result.enrollment,
    });
  } catch (err) {
    console.error("enrollCourse error:", err);

    if (err.code === "COURSE_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Course not found or not published" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/courses/:courseId/lectures/:lectureId/progress
export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = getUserId(req.user);
    const { watchedSeconds, completed } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const result = await updateLectureProgressService(
      userId,
      courseId,
      lectureId,
      watchedSeconds,
      completed
    );

    return res.status(200).json({
      message: "Progress updated",
      courseProgress: {
        userId: result.userId,
        courseId: result.courseId,
        progressPercent: result.progressPercent,
        status: result.status,
      },
    });
  } catch (err) {
    console.error("updateLectureProgress error:", err);

    if (err && err.message && err.message.includes("LECTURE_NOT_IN_COURSE")) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }
    if (err && err.message && err.message.includes("USER_NOT_ENROLLED")) {
      return res
        .status(403)
        .json({ message: "User is not enrolled in this course" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/my/courses
export const getMyCourses = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const status = req.query.status || null;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const myCourses = await getMyCoursesService(userId, status);
    return res.status(200).json(myCourses);
  } catch (err) {
    console.error("getMyCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/admin/teachers/:teacherId/courses/:courseId/lectures
export const getLecturesByTeacherInCourse = async (req, res) => {
  try {
    const user = req.user;

    // Chỉ Admin
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    const { teacherId, courseId } = req.params;

    const lectures = await getLecturesByTeacherInCourseService(courseId, teacherId);

    return res.status(200).json({
      courseId,
      teacherId,
      total: lectures.length,
      lectures,
    });
  } catch (err) {
    console.error("getLecturesByTeacherInCourse error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};