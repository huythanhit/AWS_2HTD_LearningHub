// src/services/test.service.js
// Logic cho module bài kiểm tra

import {
  createQuestion,
  getQuestionsByAuthor,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById
} from '../models/question.model.js';

import {
  createExamWithQuestions,
  getExamDetail,
  getExamsByCreator,
  updateExamWithQuestions,
  setExamPublished,
  deleteExamById
} from '../models/exam.model.js';

import {
  createSubmission,
  getSubmissionById,
  saveSubmissionGrading,
  getSubmissionsByUser,
  getSubmissionWithDetails
} from '../models/submission.model.js';

// ====== THÊM MỚI CHO NOTIFICATION ======
import {
  createNotification,
  createNotificationsForUsers
} from './notification.service.js';
import { sql, getPool } from '../config/db.js';
// =======================================

// ============================
// Helper chung
// ============================

// Parse JSON choices / tags cho tất cả câu hỏi trong 1 exam
function parseExamQuestions(exam) {
  if (!exam) return null;

  exam.questions = exam.questions.map((q) => ({
    ...q,
    choices: q.choices ? JSON.parse(q.choices) : null,
    tags: q.tags ? JSON.parse(q.tags) : null
  }));

  return exam;
}

// ============================
// PHẦN GIÁO VIÊN / ADMIN
// ============================

// ---------- CÂU HỎI ----------

// Tạo câu hỏi cho giáo viên
export async function createTeacherQuestion(teacherId, payload) {
  const { title, body, type, choices, difficulty, tags } = payload;

  const choicesJson = choices ? JSON.stringify(choices) : null;
  const tagsJson = tags ? JSON.stringify(tags) : null;

  const question = await createQuestion({
    authorId: teacherId,
    title,
    body,
    type,
    choicesJson,
    difficulty,
    tagsJson
  });

  if (question.choices) {
    question.choices = JSON.parse(question.choices);
  }
  if (question.tags) {
    question.tags = JSON.parse(question.tags);
  }

  return question;
}

// Lấy danh sách câu hỏi của giáo viên
export async function listTeacherQuestions(
  teacherId,
  { search, type, page, pageSize }
) {
  const questions = await getQuestionsByAuthor({
    authorId: teacherId,
    search,
    type,
    page,
    pageSize
  });

  return questions.map((q) => ({
    ...q,
    choices: q.choices ? JSON.parse(q.choices) : null,
    tags: q.tags ? JSON.parse(q.tags) : null
  }));
}

// Lấy chi tiết 1 câu hỏi của giáo viên
export async function getTeacherQuestionDetail(teacherId, questionId) {
  const question = await getQuestionById(questionId);
  if (!question) return null;

  // chỉ cho xem câu hỏi của chính mình
  if (
    String(question.author_id).toLowerCase() !==
    String(teacherId).toLowerCase()
  ) {
    const err = new Error('You are not allowed to view this question');
    err.status = 403;
    throw err;
  }

  return {
    ...question,
    choices: question.choices ? JSON.parse(question.choices) : null,
    tags: question.tags ? JSON.parse(question.tags) : null
  };
}

// Cập nhật câu hỏi
export async function updateTeacherQuestion(teacherId, questionId, payload) {
  // Check quyền
  await getTeacherQuestionDetail(teacherId, questionId);

  const choicesJson = payload.choices
    ? JSON.stringify(payload.choices)
    : null;
  const tagsJson = payload.tags ? JSON.stringify(payload.tags) : null;

  const updated = await updateQuestionById(questionId, {
    ...payload,
    choicesJson,
    tagsJson
  });

  return {
    ...updated,
    choices: updated.choices ? JSON.parse(updated.choices) : null,
    tags: updated.tags ? JSON.parse(updated.tags) : null
  };
}

// Xoá câu hỏi
export async function deleteTeacherQuestion(teacherId, questionId) {
  // Check quyền
  await getTeacherQuestionDetail(teacherId, questionId);

  await deleteQuestionById(questionId);
}

// ---------- ĐỀ THI ----------

// Tạo bài kiểm tra
export async function createTeacherExam(teacherId, payload) {
  const exam = await createExamWithQuestions({
    courseId: payload.courseId || null,
    title: payload.title,
    description: payload.description,
    durationMinutes: payload.durationMinutes,
    passingScore: payload.passingScore,
    randomizeQuestions: payload.randomizeQuestions,
    createdBy: teacherId,
    questions: payload.questions
  });

  return exam;
}

// Lấy chi tiết exam (cho giáo viên)
export async function getTeacherExamDetail(examId) {
  const exam = await getExamDetail(examId);
  if (!exam) return null;
  return parseExamQuestions(exam);
}

// List đề thi của giáo viên
export async function listTeacherExams(
  teacherId,
  { page, pageSize, search }
) {
  const exams = await getExamsByCreator({
    creatorId: teacherId,
    page,
    pageSize,
    search
  });
  return exams;
}

// Cập nhật đề thi (title, description, duration, list câu hỏi...)
export async function updateTeacherExam(teacherId, examId, payload) {
  const exam = await getExamDetail(examId);
  if (!exam) {
    const err = new Error('Exam not found');
    err.status = 404;
    throw err;
  }

  if (
    String(exam.created_by).toLowerCase() !==
    String(teacherId).toLowerCase()
  ) {
    const err = new Error('You are not allowed to update this exam');
    err.status = 403;
    throw err;
  }

  const updated = await updateExamWithQuestions({
    examId,
    courseId: payload.courseId || null,
    title: payload.title,
    description: payload.description,
    durationMinutes: payload.durationMinutes,
    passingScore: payload.passingScore,
    randomizeQuestions: payload.randomizeQuestions,
    questions: payload.questions
  });

  return updated;
}

// Publish / unpublish đề
export async function publishTeacherExam(teacherId, examId, published) {
  const exam = await getExamDetail(examId);
  if (!exam) {
    const err = new Error('Exam not found');
    err.status = 404;
    throw err;
  }

  if (
    String(exam.created_by).toLowerCase() !==
    String(teacherId).toLowerCase()
  ) {
    const err = new Error('You are not allowed to publish this exam');
    err.status = 403;
    throw err;
  }

  const updated = await setExamPublished(examId, published);

  // NOTI: Nếu vừa publish và có course, gửi thông báo NEW_EXAM cho các học viên đã enroll
  if (published && updated.course_id) {
    const pool = await getPool();
    const enrollResult = await pool.request()
      .input('course_id', sql.UniqueIdentifier, updated.course_id)
      .query(`
        SELECT user_id
        FROM enrollments
        WHERE course_id = @course_id AND status = N'active';
      `);

    const userIds = enrollResult.recordset.map((r) => r.user_id);

    if (userIds.length > 0) {
      await createNotificationsForUsers({
        userIds,
        type: 'NEW_EXAM',
        payloadBuilder: () => ({
          examId: updated.id,
          examTitle: updated.title,
          courseId: updated.course_id
        })
      });
    }
  }

  return updated;
}

// Xoá đề thi
export async function deleteTeacherExam(teacherId, examId) {
  const exam = await getExamDetail(examId);
  if (!exam) {
    const err = new Error('Exam not found');
    err.status = 404;
    throw err;
  }

  if (
    String(exam.created_by).toLowerCase() !==
    String(teacherId).toLowerCase()
  ) {
    const err = new Error('You are not allowed to delete this exam');
    err.status = 403;
    throw err;
  }

  await deleteExamById(examId);
}

// ============================
// PHẦN HỌC SINH
// ============================

// Học sinh bắt đầu làm bài -> tạo submission mới + trả về đề
// Học sinh bấm Start để bắt đầu làm bài
export async function startStudentExam(studentId, examId) {
  const exam = await getExamDetail(examId);
  if (!exam) return null;

  // chỉ cho làm nếu exam đã publish
  if (!exam.published) {
    const err = new Error('Exam is not published');
    err.status = 400;
    throw err;
  }

  // Chuyển JSON choices/tags cho từng câu hỏi
  parseExamQuestions(exam);

  // Tạo 1 submission mới (DB tự set started_at = SYSDATETIMEOFFSET())
  const submission = await createSubmission({
    examId,
    userId: studentId,
    autoGraded: true
  });

  // ======= TÍNH THÔNG TIN THỜI GIAN =======
  const durationMinutes = exam.duration_minutes; // cột trong DB
  const durationSeconds =
    typeof durationMinutes === 'number' && durationMinutes > 0
      ? durationMinutes * 60
      : null;

  // started_at lấy từ DB
  let startedAt = submission.started_at;
  if (startedAt instanceof Date) {
    startedAt = startedAt.toISOString();
  } else if (startedAt && typeof startedAt === 'string') {
    startedAt = new Date(startedAt).toISOString();
  }

  let expiresAt = null;
  if (durationSeconds && startedAt) {
    const startDate = new Date(startedAt);
    expiresAt = new Date(
      startDate.getTime() + durationSeconds * 1000
    ).toISOString();
  }

  // Trả thêm startedAt, durationSeconds, expiresAt cho FE
  return {
    submissionId: submission.id,
    exam,
    startedAt, // thời điểm bắt đầu (ISO string)
    durationSeconds, // tổng số giây được làm
    expiresAt // thời điểm hết giờ (ISO string)
  };
}

// ========== Logic chấm điểm từng câu ==========
function gradeSingleQuestion(question, answerPayload, questionPoints) {
  const type = question.type;
  const choices = question.choices || [];
  let awardedPoints = 0;
  let correct = false;

  // Choice-based questions: trắc nghiệm, true/false, image, audio...
  const isChoiceType = [
    'single_choice',
    'multiple_choice',
    'true_false',
    'true_false_ng',
    'image_choice',
    'audio_choice'
  ].includes(type);

  if (isChoiceType) {
    const correctIndexes = choices
      .map((c, idx) => (c.isCorrect ? idx : null))
      .filter((idx) => idx !== null);

    if (
      !answerPayload ||
      !Array.isArray(answerPayload.selectedOptionIndexes)
    ) {
      return { awardedPoints: 0, correct: false };
    }

    // bỏ trùng index nếu FE gửi thừa
    const selected = Array.from(
      new Set(answerPayload.selectedOptionIndexes.map((n) => Number(n)))
    ).filter((n) => !Number.isNaN(n));

    if (type === 'multiple_choice') {
      if (selected.length === 0) {
        return { awardedPoints: 0, correct: false };
      }

      const allCorrect = selected.every((idx) =>
        correctIndexes.includes(idx)
      );
      const noMissing = correctIndexes.every((idx) =>
        selected.includes(idx)
      );
      correct = allCorrect && noMissing;
      awardedPoints = correct ? questionPoints : 0;
      return { awardedPoints, correct };
    }

    // Các loại single choice
    if (selected.length !== 1 || correctIndexes.length === 0) {
      return { awardedPoints: 0, correct: false };
    }

    correct = selected[0] === correctIndexes[0];
    awardedPoints = correct ? questionPoints : 0;
    return { awardedPoints, correct };
  }

  // Short answer
  if (type === 'short_answer') {
    const cfg = question.choices || {};
    const correctAnswers = cfg.correctAnswers || [];
    const caseInsensitive = cfg.caseInsensitive;
    const trim = cfg.trim;

    let student = (answerPayload && answerPayload.text) || '';
    if (typeof student !== 'string') student = String(student);

    if (trim) {
      student = student.trim();
    }

    let compareList = correctAnswers.map((a) =>
      typeof a === 'string' ? a : String(a)
    );

    if (caseInsensitive) {
      student = student.toLowerCase();
      compareList = compareList.map((a) => a.toLowerCase());
    }

    if (compareList.includes(student)) {
      awardedPoints = questionPoints;
      correct = true;
    }

    return { awardedPoints, correct };
  }

  // Cloze (đục lỗ)
  if (type === 'cloze_single' || type === 'cloze_multiple') {
    const cfg = question.choices || {};
    const blanks = cfg.blanks || [];
    const ansBlanks = (answerPayload && answerPayload.blanks) || {};
    if (!Array.isArray(blanks) || blanks.length === 0) {
      return { awardedPoints: 0, correct: false };
    }

    let correctCount = 0;

    for (const blank of blanks) {
      const id = String(blank.id);
      const correctAnswers = (blank.correctAnswers || []).map((a) =>
        typeof a === 'string' ? a : String(a)
      );
      const caseInsensitive = blank.caseInsensitive;
      const trim = blank.trim;

      let student = ansBlanks[id] ?? '';
      if (typeof student !== 'string') student = String(student);

      if (trim) {
        student = student.trim();
      }

      let compareStudent = student;
      let compareList = correctAnswers;

      if (caseInsensitive) {
        compareStudent = student.toLowerCase();
        compareList = correctAnswers.map((a) => a.toLowerCase());
      }

      if (compareList.includes(compareStudent)) {
        correctCount += 1;
      }
    }

    const ratio = correctCount / blanks.length;
    awardedPoints = Math.round(questionPoints * ratio * 100) / 100;
    correct = ratio === 1;
    return { awardedPoints, correct };
  }

  // Loại không hỗ trợ auto-grade → 0 điểm
  return { awardedPoints: 0, correct: false };
}

// Chấm toàn bộ bài
function gradeStudentAnswers(exam, answers) {
  const answerMap = new Map();
  (answers || []).forEach((a) => {
    if (a && a.questionId) {
      answerMap.set(a.questionId, a.answer);
    }
  });

  const items = [];
  let totalScore = 0;
  let totalPointsPossible = 0;
  let correctCount = 0;
  const totalQuestions = exam.questions.length;

  for (const q of exam.questions) {
    const questionId = q.question_id;
    const questionPoints = Number(q.points || 1);
    totalPointsPossible += questionPoints;

    const answerPayload = answerMap.get(questionId);
    const { awardedPoints, correct } = gradeSingleQuestion(
      q,
      answerPayload,
      questionPoints
    );

    totalScore += awardedPoints;
    if (correct) correctCount += 1;

    items.push({
      questionId,
      answerJson: JSON.stringify(answerPayload ?? null),
      awardedPoints,
      graded: true
    });
  }

  const passingScore = Number(exam.passing_score ?? 0); // %
  const percentage =
    totalPointsPossible > 0
      ? (totalScore / totalPointsPossible) * 100
      : 0;
  const passed = percentage >= passingScore;

  const resultSummary = {
    totalQuestions,
    correctCount,
    totalScore,
    totalPointsPossible,
    percentage,
    passingScore,
    passed
  };

  return { items, totalScore, resultSummary };
}

// Học sinh nộp bài
export async function submitStudentExam(studentId, submissionId, payload) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    const err = new Error('Submission not found');
    err.status = 404;
    throw err;
  }

  // kiểm tra quyền sở hữu
  if (
    String(submission.user_id).toLowerCase() !==
    String(studentId).toLowerCase()
  ) {
    const err = new Error('You are not allowed to submit this exam');
    err.status = 403;
    throw err;
  }

  if (submission.status === 'completed') {
    const err = new Error('Submission already completed');
    err.status = 400;
    throw err;
  }

  const exam = await getExamDetail(submission.exam_id);
  if (!exam) {
    const err = new Error('Exam not found');
    err.status = 404;
    throw err;
  }

  // ========== TÍNH THỜI GIAN ĐÃ LÀM ==========
  const durationMinutes = exam.duration_minutes; // DB column
  const timeLimitSeconds =
    typeof durationMinutes === 'number' && durationMinutes > 0
      ? durationMinutes * 60
      : null;

  let elapsedSeconds = 0;
  let timeoutExceeded = false;

  if (submission.started_at && timeLimitSeconds) {
    const startedAt =
      submission.started_at instanceof Date
        ? submission.started_at
        : new Date(submission.started_at);

    const now = new Date();
    elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - startedAt.getTime()) / 1000)
    );

    if (elapsedSeconds > timeLimitSeconds) {
      timeoutExceeded = true;
    }
  }

  // Parse câu hỏi trước khi chấm
  parseExamQuestions(exam);

  const { items, totalScore, resultSummary } = gradeStudentAnswers(
    exam,
    payload.answers || []
  );

  // Ghi thêm thông tin thời gian vào resultSummary (sẽ được lưu JSON trong DB)
  resultSummary.timeLimitSeconds = timeLimitSeconds;
  resultSummary.elapsedSeconds = elapsedSeconds;
  resultSummary.timeoutExceeded = timeoutExceeded;

  await saveSubmissionGrading({
    submissionId,
    items,
    totalScore,
    resultSummary
  });

  // ===== NOTI: Gửi thông báo cho Member + Teacher =====
  // 1. Member – EXAM_RESULT
  await createNotification({
    userId: submission.user_id,
    type: 'EXAM_RESULT',
    payload: {
      examId: exam.id,
      examTitle: exam.title,
      submissionId,
      courseId: exam.course_id,
      totalScore,
      summary: resultSummary
    }
  });

  // 2. Teacher – NEW_SUBMISSION (người tạo đề)
  if (exam.created_by) {
    await createNotification({
      userId: exam.created_by,
      type: 'NEW_SUBMISSION',
      payload: {
        examId: exam.id,
        examTitle: exam.title,
        submissionId,
        studentId: submission.user_id,
        totalScore,
        summary: resultSummary
      }
    });
  }
  // ==========================================

  return {
    submissionId,
    totalScore,
    result: resultSummary
  };
}

// ============================
// LỊCH SỬ & REVIEW CHO HỌC SINH
// ============================

// Lịch sử bài làm của 1 học sinh
export async function listStudentSubmissions(studentId, { page, pageSize }) {
  const rows = await getSubmissionsByUser({
    userId: studentId,
    page,
    pageSize
  });

  return rows.map((r) => ({
    submissionId: r.id,
    examId: r.exam_id,
    examTitle: r.exam_title,
    totalScore: Number(r.total_score ?? 0),
    status: r.status,
    startedAt: r.started_at,
    submittedAt: r.submitted_at,
    summary: r.result ? JSON.parse(r.result) : null
  }));
}

// Review chi tiết 1 submission
export async function getSubmissionReview(submissionId, user) {
  const submission = await getSubmissionWithDetails(submissionId);
  if (!submission) return null;

  // Kiểm tra quyền: Member chỉ xem bài của mình.
  if (user && user.roleName === 'Member') {
    if (
      String(submission.user_id).toLowerCase() !==
      String(user.localUserId).toLowerCase()
    ) {
      const err = new Error('You are not allowed to view this submission');
      err.status = 403;
      throw err;
    }
  }
  // Admin/Teacher được phép xem tất cả

  const resultSummary = submission.result
    ? JSON.parse(submission.result)
    : null;

  const items = (submission.items || []).map((it) => ({
    questionId: it.question_id,
    title: it.title,
    body: it.body,
    type: it.type,
    choices: it.choices ? JSON.parse(it.choices) : null,
    tags: it.tags ? JSON.parse(it.tags) : null,
    studentAnswer: it.answer ? JSON.parse(it.answer) : null,
    awardedPoints: Number(it.awarded_points ?? 0),
    maxPoints: Number(it.points ?? 1),
    sequence: it.sequence
  }));

  return {
    submissionId: submission.id,
    examId: submission.exam_id,
    examTitle: submission.exam_title,
    totalScore: Number(submission.total_score ?? 0),
    submittedAt: submission.submitted_at,
    summary: resultSummary,
    items
  };
}
