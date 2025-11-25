// src/services/test.service.js
// Logic cho module bài kiểm tra

import {
  createQuestion,
  getQuestionsByAuthor
} from '../models/question.model.js';

import {
  createExamWithQuestions,
  getExamDetail
} from '../models/exam.model.js';

import {
  createSubmission,
  getSubmissionById,
  saveSubmissionGrading
} from '../models/submission.model.js';

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
// PHẦN GIÁO VIÊN
// ============================

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

// Lấy câu hỏi của giáo viên
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
    expiresAt = new Date(startDate.getTime() + durationSeconds * 1000).toISOString();
  }

  // Trả thêm startedAt, durationSeconds, expiresAt cho FE
  return {
    submissionId: submission.id,
    exam,
    startedAt,       // thời điểm bắt đầu (ISO string)
    durationSeconds, // tổng số giây được làm
    expiresAt        // thời điểm hết giờ (ISO string)
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

  return {
    submissionId,
    totalScore,
    result: resultSummary
  };
}
