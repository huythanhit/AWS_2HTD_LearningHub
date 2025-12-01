// src/controllers/test.controller.js

import { successResponse, errorResponse } from '../utils/response.js';
import { createQuestionSchema } from '../validators/question.validator.js';
import { createExamSchema } from '../validators/exam.validator.js';
import { submitExamSchema } from '../validators/submission.validator.js';

import * as testService from '../services/test.service.js';

// ============================
// API test cho member
// ============================
export async function testMemberAccess(req, res, next) {
  try {
    const user = req.user;

    return successResponse(
      res,
      {
        message: 'Chào mừng Member! Bạn có quyền truy cập endpoint này.',
        accessGranted: true,
        userInfo: {
          email: user.email,
          role: user.roleName,
          cognitoGroups: user.groups,
          localUserId: user.localUserId
        },
        timestamp: new Date().toISOString()
      },
      'Member access granted',
      200
    );
  } catch (err) {
    return next(err);
  }
}

// ============================
// GIÁO VIÊN / ADMIN – CÂU HỎI
// ============================

// POST /api/tests/questions
export async function createQuestion(req, res, next) {
  try {
    const { error, value } = createQuestionSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const question = await testService.createTeacherQuestion(teacherId, value);

    return successResponse(res, question, 'Question created', 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/questions
export async function listMyQuestions(req, res, next) {
  try {
    const teacherId = req.user.localUserId;

    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || null;
    const type = req.query.type || null;

    const questions = await testService.listTeacherQuestions(teacherId, {
      search,
      type,
      page,
      pageSize
    });

    return successResponse(res, { items: questions, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/questions/:id
export async function getQuestionDetail(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { id } = req.params;

    const question = await testService.getTeacherQuestionDetail(
      teacherId,
      id
    );

    if (!question) {
      return errorResponse(res, 'Question not found', 404);
    }

    return successResponse(res, question);
  } catch (err) {
    return next(err);
  }
}

// PUT /api/tests/questions/:id
export async function updateQuestion(req, res, next) {
  try {
    const { error, value } = createQuestionSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const { id } = req.params;

    const question = await testService.updateTeacherQuestion(
      teacherId,
      id,
      value
    );

    return successResponse(res, question, 'Question updated');
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/tests/questions/:id
export async function deleteQuestion(req, res, next) {
  try {
    const teacherId = req.user.localUserId;
    const { id } = req.params;

    await testService.deleteTeacherQuestion(teacherId, id);

    return successResponse(res, null, 'Question deleted');
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

    return successResponse(res, { items: exams, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:id (cho GV/Admin xem chi tiết)
export async function getExamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const exam = await testService.getTeacherExamDetail(id);

    if (!exam) {
      return errorResponse(res, 'Exam not found', 404);
    }

    return successResponse(res, exam);
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

    const exam = await testService.publishTeacherExam(teacherId, id, published);

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
// HỌC SINH
// ============================

// POST /api/tests/exams/:id/start
export async function startExamForStudent(req, res, next) {
  try {
    const examId = req.params.id;
    const studentId = req.user.localUserId;

    const data = await testService.startStudentExam(studentId, examId);
    if (!data) {
      return errorResponse(res, 'Exam not found', 404);
    }

    return successResponse(res, data, 'Exam started');
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

    const submissionId = req.params.id;
    const studentId = req.user.localUserId;

    const result = await testService.submitStudentExam(
      studentId,
      submissionId,
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

    const submissions = await testService.listStudentSubmissions(studentId, {
      page,
      pageSize
    });

    return successResponse(res, { items: submissions, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/submissions/:id/review
export async function reviewSubmission(req, res, next) {
  try {
    const submissionId = req.params.id;
    const user = req.user || null; // có thể null nếu chưa login, tuỳ bạn

    const data = await testService.getSubmissionReview(submissionId, user);

    if (!data) {
      return errorResponse(res, 'Submission not found', 404);
    }

    return successResponse(res, data, 'Submission review');
  } catch (err) {
    return next(err);
  }
}
