// src/controllers/test.controller.js

import { successResponse, errorResponse } from "../utils/response.js";
import { createQuestionSchema } from "../validators/question.validator.js";
import { createExamSchema } from "../validators/exam.validator.js";
import { submitExamSchema } from "../validators/submission.validator.js";

import * as testService from "../services/test.service.js";

// ============================

// ============================

// API test cho member
export async function testMemberAccess(req, res, next) {
  try {
    const user = req.user;

    return successResponse(
      res,
      {
        message: "Chào mừng Member! Bạn có quyền truy cập endpoint này.",
        accessGranted: true,
        userInfo: {
          email: user.email,
          role: user.roleName,
          cognitoGroups: user.groups,
          localUserId: user.localUserId,
        },
        timestamp: new Date().toISOString(),
      },
      "Member access granted",
      200
    );
  } catch (err) {
    return next(err);
  }
}

// ============================
// GIÁO VIÊN
// ============================

// POST /api/tests/questions
export async function createQuestion(req, res, next) {
  try {
    const { error, value } = createQuestionSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const teacherId = req.user.localUserId;
    const question = await testService.createTeacherQuestion(teacherId, value);

    return successResponse(res, question, "Question created", 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/questions
export async function listMyQuestions(req, res, next) {
  try {
    const teacherId = req.user.localUserId;

    const page = parseInt(req.query.page || "1", 10);
    const pageSize = parseInt(req.query.pageSize || "20", 10);
    const search = req.query.search || null;
    const type = req.query.type || null;

    const questions = await testService.listTeacherQuestions(teacherId, {
      search,
      type,
      page,
      pageSize,
    });

    return successResponse(res, { items: questions, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

// POST /api/tests/exams
export async function createExam(req, res, next) {
  try {
    const { error, value } = createExamSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const teacherId = req.user.localUserId;
    const exam = await testService.createTeacherExam(teacherId, value);

    return successResponse(res, exam, "Exam created", 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:id (cho GV xem chi tiết)
export async function getExamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const exam = await testService.getTeacherExamDetail(id);

    if (!exam) {
      return errorResponse(res, "Exam not found", 404);
    }

    return successResponse(res, exam);
  } catch (err) {
    return next(err);
  }
}

// ============================
// HỌC SINH
// ============================

// POST /api/tests/exams/:id/start
export async function startExamForStudent(req, res, next) {
  try {
    const examId = req.params.id;
    const studentId = req.user.localUserId;

    const data = await testService.startStudentExam(studentId, examId);
    if (!data) {
      return errorResponse(res, "Exam not found", 404);
    }

    return successResponse(res, data, "Exam started");
  } catch (err) {
    return next(err);
  }
}

// POST /api/tests/submissions/:id/submit
export async function submitExam(req, res, next) {
  try {
    const { error, value } = submitExamSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const submissionId = req.params.id;
    const studentId = req.user.localUserId;

    const result = await testService.submitStudentExam(
      studentId,
      submissionId,
      value
    );

    return successResponse(res, result, "Exam submitted");
  } catch (err) {
    return next(err);
  }
}
