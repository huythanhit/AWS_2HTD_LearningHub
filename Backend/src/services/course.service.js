// src/services/course.service.js
// Business logic cho courses

import * as courseModel from "../models/course.model.js";

// Lấy danh sách courses với filter và pagination
export async function getCourses(filters = {}) {
  return await courseModel.findAllCourses(filters);
}

// Lấy chi tiết course
export async function getCourseById(courseId) {
  const course = await courseModel.findCourseById(courseId);

  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  return course;
}

// Tạo course mới
export async function createCourse(courseData, creatorId) {
  // Kiểm tra slug đã tồn tại
  const slugExists = await courseModel.checkSlugExists(courseData.slug);
  if (slugExists) {
    const error = new Error("Slug already exists");
    error.statusCode = 409;
    throw error;
  }

  const newCourse = await courseModel.createCourse({
    ...courseData,
    creator_id: creatorId,
  });

  return newCourse;
}

// Cập nhật course
export async function updateCourse(courseId, courseData) {
  // Kiểm tra course tồn tại
  const existingCourse = await courseModel.findCourseById(courseId);
  if (!existingCourse) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra slug đã tồn tại (nếu có thay đổi slug)
  if (courseData.slug && courseData.slug !== existingCourse.slug) {
    const slugExists = await courseModel.checkSlugExists(
      courseData.slug,
      courseId
    );
    if (slugExists) {
      const error = new Error("Slug already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedCourse = await courseModel.updateCourse(courseId, {
    slug: courseData.slug || existingCourse.slug,
    title: courseData.title || existingCourse.title,
    short_description:
      courseData.short_description || existingCourse.short_description,
    description: courseData.description || existingCourse.description,
    price:
      courseData.price !== undefined ? courseData.price : existingCourse.price,
    currency: courseData.currency || existingCourse.currency,
    published:
      courseData.published !== undefined
        ? courseData.published
        : existingCourse.published,
  });

  return updatedCourse;
}

// Xóa course
export async function deleteCourse(courseId) {
  // Kiểm tra course tồn tại
  const existingCourse = await courseModel.findCourseById(courseId);
  if (!existingCourse) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  const deleted = await courseModel.deleteCourse(courseId);

  if (!deleted) {
    const error = new Error("Failed to delete course");
    error.statusCode = 500;
    throw error;
  }

  return { message: "Course deleted successfully" };
}
