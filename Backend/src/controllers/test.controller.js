// src/controllers/test.controller.js

import { successResponse, errorResponse } from '../utils/response.js';
import { createQuestionInExamSchema } from '../validators/question.validator.js';
import { createExamSchema } from '../validators/exam.validator.js';
import { submitExamSchema } from '../validators/submission.validator.js';

import * as testService from '../services/test.service.js';

// ============================
// API test cho member
// ============================
export async function testMemberAccess(req, res, next) {
  try {
    const user = req.user;
    return successResponse(res, { user }, 'Member access OK');
  } catch (err) {
    return next(err);
  }
}

// ============================
// GIÁO VIÊN / ADMIN – ĐỀ THI
// ============================

// POST /api/tests/exams
export async function createExam(req, res, next) {
  try {
    const { error, value } = createExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const exam = await testService.createTeacherExam(teacherId, value);

    return successResponse(res, exam, 'Exam created', 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams
export async function listMyExams(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || null;

    const exams = await testService.listTeacherExams(teacherId, {
      page,
      pageSize,
      search
    });

    return successResponse(res, exams, 'My exams');
  } catch (err) {
    return next(err);
  }
}

// (MỚI) GET /api/tests/public-exams – Member xem exam đã publish
export async function listPublicExamsForMember(req, res, next) {
  try {
    const userId = req.user.localUserId;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || null;
    const courseId = req.query.courseId || null;

    const exams = await testService.listMemberPublicExams(userId, {
      page,
      pageSize,
      search,
      courseId
    });

    return successResponse(res, exams, 'Public exams');
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:id
export async function getExamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const exam = await testService.getTeacherExamDetail(id);

    if (!exam) {
      return errorResponse(res, 'Exam not found', 404);
    }

    return successResponse(res, exam, 'Exam detail');
  } catch (err) {
    return next(err);
  }
}

// PUT /api/tests/exams/:id
export async function updateExam(req, res, next) {
  try {
    const { error, value } = createExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const { id } = req.params;

    const exam = await testService.updateTeacherExam(teacherId, id, value);

    return successResponse(res, exam, 'Exam updated');
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/tests/exams/:id/publish
export async function publishExam(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { id } = req.params;
    const { published } = req.body;

    if (typeof published !== 'boolean') {
      return errorResponse(res, 'published must be boolean', 400);
    }

    const exam = await testService.publishTeacherExam(
      teacherId,
      id,
      published
    );

    return successResponse(
      res,
      exam,
      published ? 'Exam published' : 'Exam unpublished'
    );
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/tests/exams/:id
export async function deleteExam(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { id } = req.params;

    await testService.deleteTeacherExam(teacherId, id);

    return successResponse(res, null, 'Exam deleted');
  } catch (err) {
    return next(err);
  }
}

// ============================
// GIÁO VIÊN / ADMIN – CÂU HỎI TRONG ĐỀ
// ============================

// POST /api/tests/exams/:examId/questions
export async function createQuestionInExam(req, res, next) {
  try {
    const { error, value } = createQuestionInExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const { examId } = req.params;

    const result = await testService.createQuestionInExam(
      teacherId,
      examId,
      value
    );

    // result: { examId, examTitle, ..., questions: [ { ... } ] }
    return successResponse(res, result, 'Question created in exam', 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:examId/questions
export async function listQuestionsInExam(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { examId } = req.params;

    const result = await testService.listQuestionsInExam(teacherId, examId);

    // result: { examId, examTitle, ..., questions: [ ... ] }
    return successResponse(res, result, 'Questions in exam');
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:examId/questions/:questionId
export async function getQuestionInExamDetail(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { examId, questionId } = req.params;

    const result = await testService.getQuestionInExamDetail(
      teacherId,
      examId,
      questionId
    );

    // result: { examId, examTitle, ..., questions: [ one question ] }
    return successResponse(res, result, 'Question detail in exam');
  } catch (err) {
    return next(err);
  }
}

// PUT /api/tests/exams/:examId/questions/:questionId
export async function updateQuestionInExam(req, res, next) {
  try {
    const { error, value } = createQuestionInExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const { examId, questionId } = req.params;

    const result = await testService.updateQuestionInExam(
      teacherId,
      examId,
      questionId,
      value
    );

    // result: { examId, examTitle, ..., questions: [ one question ] }
    return successResponse(res, result, 'Question in exam updated');
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/tests/exams/:examId/questions/:questionId
export async function deleteQuestionInExam(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { examId, questionId } = req.params;

    await testService.deleteQuestionInExam(teacherId, examId, questionId);

    return successResponse(res, null, 'Question in exam deleted');
  } catch (err) {
    return next(err);
  }
}

// ============================
// PHẦN HỌC SINH
// ============================

// POST /api/tests/exams/:id/start
export async function startExamForStudent(req, res, next) {
  try {
    const studentId = req.user.localUserId;
    const { id } = req.params;

    const result = await testService.startStudentExam(studentId, id);
    if (!result) {
      return errorResponse(res, 'Exam not found', 404);
    }

    return successResponse(res, result, 'Exam started');
  } catch (err) {
    return next(err);
  }
}

// POST /api/tests/submissions/:id/submit
export async function submitExam(req, res, next) {
  try {
    const { error, value } = submitExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const studentId = req.user.localUserId;
    const { id } = req.params; // submissionId

    const result = await testService.submitStudentExam(
      studentId,
      id,
      value
    );

    return successResponse(res, result, 'Exam submitted');
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/my-submissions
export async function listMySubmissions(req, res, next) {
  try {
    const studentId = req.user.localUserId;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    const submissions = await testService.listStudentSubmissions(
      studentId,
      { page, pageSize }
    );

    return successResponse(res, submissions, 'My submissions');
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/submissions/:id/review
export async function reviewSubmission(req, res, next) {
  try {
    const { id } = req.params;

    const review = await testService.getSubmissionReview(id, req.user);
    if (!review) {
      return errorResponse(res, 'Submission not found', 404);
    }

    return successResponse(res, review, 'Submission review');
  } catch (err) {
    return next(err);
  }
}
