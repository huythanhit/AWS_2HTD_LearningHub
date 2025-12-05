// src/models/exam.model.js
// Các hàm thao tác với bảng exams, exam_questions

import { sql, pool, poolConnect } from '../config/db.js';

// =============================
// TẠO ĐỀ THI
// =============================
export async function createExam({
  courseId,
  title,
  description,
  durationMinutes,
  passingScore,
  randomizeQuestions,
  createdBy
}) {
  await poolConnect;
  const request = pool.request();

  request.input('course_id', sql.UniqueIdentifier, courseId);
  request.input('title', sql.NVarChar(255), title);
  request.input('description', sql.NVarChar(sql.MAX), description || null);
  request.input('duration_minutes', sql.Int, durationMinutes);
  request.input('passing_score', sql.Decimal(5, 2), passingScore);
  request.input('randomize_questions', sql.Bit, randomizeQuestions ? 1 : 0);
  request.input('created_by', sql.UniqueIdentifier, createdBy);

  const result = await request.query(`
    INSERT INTO exams (
      course_id,
      title,
      description,
      duration_minutes,
      passing_score,
      randomize_questions,
      created_by
    )
    OUTPUT inserted.*
    VALUES (
      @course_id,
      @title,
      @description,
      @duration_minutes,
      @passing_score,
      @randomize_questions,
      @created_by
    );
  `);

  return result.recordset[0];
}

// =============================
// LẤY CHI TIẾT ĐỀ + CÂU HỎI
// =============================
export async function getExamDetail(examId) {
  await poolConnect;
  const request = pool.request();
  request.input('exam_id', sql.UniqueIdentifier, examId);

  const examResult = await request.query(`
    SELECT
      e.id,
      e.course_id,
      e.title,
      e.description,
      e.duration_minutes,
      e.passing_score,
      e.randomize_questions,
      e.published,
      e.created_by
    FROM exams e
    WHERE e.id = @exam_id;
  `);

  if (examResult.recordset.length === 0) {
    return null;
  }

  const exam = examResult.recordset[0];

  const qRequest = pool.request();
  qRequest.input('exam_id', sql.UniqueIdentifier, examId);

  const questionsResult = await qRequest.query(`
    SELECT
      eq.id AS exam_question_id,
      eq.exam_id,
      eq.question_id,
      eq.points,
      eq.sequence,
      q.title,
      q.body,
      q.type,
      q.choices,
      q.tags,
      q.difficulty,
      q.author_id
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = @exam_id
    ORDER BY eq.sequence ASC, eq.id ASC;
  `);

  exam.questions = questionsResult.recordset;
  return exam;
}

// =============================
// DANH SÁCH ĐỀ THEO TEACHER
// =============================
export async function getExamsByCreator({
  creatorId,
  page = 1,
  pageSize = 20,
  search = null
}) {
  await poolConnect;
  const request = pool.request();

  const offset = (page - 1) * pageSize;

  request.input('created_by', sql.UniqueIdentifier, creatorId);
  request.input('search', sql.NVarChar(255), search || null);
  request.input('offset', sql.Int, offset);
  request.input('pageSize', sql.Int, pageSize);

  const result = await request.query(`
    SELECT
      e.id,
      e.course_id,
      e.title,
      e.description,
      e.duration_minutes,
      e.passing_score,
      e.randomize_questions,
      e.published
    FROM exams e
    WHERE e.created_by = @created_by
      AND (@search IS NULL OR e.title LIKE '%' + @search + '%')
    ORDER BY e.title ASC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
  `);

  return result.recordset;
}

// =============================
// CẬP NHẬT ĐỀ
// =============================
export async function updateExam({
  examId,
  courseId,
  title,
  description,
  durationMinutes,
  passingScore,
  randomizeQuestions
}) {
  await poolConnect;
  const request = pool.request();

  request.input('id', sql.UniqueIdentifier, examId);
  request.input('course_id', sql.UniqueIdentifier, courseId);
  request.input('title', sql.NVarChar(255), title);
  request.input('description', sql.NVarChar(sql.MAX), description || null);
  request.input('duration_minutes', sql.Int, durationMinutes);
  request.input('passing_score', sql.Decimal(5, 2), passingScore);
  request.input('randomize_questions', sql.Bit, randomizeQuestions ? 1 : 0);

  const result = await request.query(`
    UPDATE exams
    SET
      course_id = @course_id,
      title = @title,
      description = @description,
      duration_minutes = @duration_minutes,
      passing_score = @passing_score,
      randomize_questions = @randomize_questions
    OUTPUT inserted.*
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// =============================
// PUBLISH / UNPUBLISH
// =============================
export async function setExamPublished(examId, published) {
  await poolConnect;
  const request = pool.request();

  request.input('id', sql.UniqueIdentifier, examId);
  request.input('published', sql.Bit, published ? 1 : 0);

  const result = await request.query(`
    UPDATE exams
    SET published = @published
    OUTPUT inserted.*
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// =============================
// XOÁ ĐỀ
// =============================
export async function deleteExamById(examId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, examId);

  await request.query(`
    DELETE FROM exams
    WHERE id = @id;
  `);
}
