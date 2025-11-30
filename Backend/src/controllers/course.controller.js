// src/controllers/course.controller.js
// Controller xử lý các request liên quan đến courses

import { successResponse, errorResponse } from "../utils/response.js";
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
} from "../validators/course.validator.js";
import * as courseService from "../services/course.service.js";

// GET /api/courses - Lấy danh sách courses
export async function getCourses(req, res, next) {
  try {
    const { error, value } = courseQuerySchema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const result = await courseService.getCourses(value);
    return successResponse(res, result, "Courses retrieved successfully");
  } catch (err) {
    return next(err);
  }
}

// GET /api/courses/:id - Lấy chi tiết course
export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Course ID is required", 400);
    }

    const course = await courseService.getCourseById(id);
    return successResponse(res, course, "Course retrieved successfully");
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode);
    }
    return next(err);
  }
}

// POST /api/courses - Tạo course mới
export async function createCourse(req, res, next) {
  try {
    const { error, value } = createCourseSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const creatorId = req.user.localUserId;
    const course = await courseService.createCourse(value, creatorId);

    return successResponse(res, course, "Course created successfully", 201);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode);
    }
    return next(err);
  }
}

// PUT /api/courses/:id - Cập nhật course
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Course ID is required", 400);
    }

    const { error, value } = updateCourseSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const course = await courseService.updateCourse(id, value);
    return successResponse(res, course, "Course updated successfully");
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode);
    }
    return next(err);
  }
}

// DELETE /api/courses/:id - Xóa course
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Course ID is required", 400);
    }

    const result = await courseService.deleteCourse(id);
    return successResponse(res, result, "Course deleted successfully");
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode);
    }
    return next(err);
  }
}
