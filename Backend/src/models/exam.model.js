// src/models/exam.model.js
// Các hàm thao tác với bảng exams, exam_questions

import { sql, pool, poolConnect } from '../config/db.js';

// Tạo exam + gán list câu hỏi trong 1 transaction
export async function createExamWithQuestions({
  courseId,
  title,
  description,
  durationMinutes,
  passingScore,
  randomizeQuestions,
  createdBy,
  questions
}) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Tạo exam
    const examReq = new sql.Request(transaction);
    examReq.input('course_id', sql.UniqueIdentifier, courseId || null);
    examReq.input('title', sql.NVarChar(255), title);
    examReq.input('description', sql.NVarChar(sql.MAX), description || null);
    examReq.input('duration_minutes', sql.Int, durationMinutes || null);
    examReq.input('passing_score', sql.Decimal(5, 2), passingScore ?? null);
    examReq.input('randomize_questions', sql.Bit, randomizeQuestions ? 1 : 0);
    examReq.input('created_by', sql.UniqueIdentifier, createdBy);

    const examResult = await examReq.query(`
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

    const exam = examResult.recordset[0];

    // Gán câu hỏi
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];

      const qReq = new sql.Request(transaction);
      qReq.input('exam_id', sql.UniqueIdentifier, exam.id);
      qReq.input('question_id', sql.UniqueIdentifier, q.questionId);
      qReq.input('points', sql.Decimal(6, 2), q.points ?? 1);
      qReq.input('sequence', sql.Int, q.sequence ?? i + 1);

      await qReq.query(`
        INSERT INTO exam_questions (exam_id, question_id, points, sequence)
        VALUES (@exam_id, @question_id, @points, @sequence);
      `);
    }

    await transaction.commit();
    return exam;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Lấy chi tiết exam + list câu hỏi
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
      e.created_by,
      e.created_at,
      e.published
    FROM exams e
    WHERE e.id = @exam_id;
  `);

  const exam = examResult.recordset[0];
  if (!exam) return null;

  const questionsResult = await request.query(`
    SELECT 
      eq.id,
      eq.points,
      eq.sequence,
      q.id AS question_id,
      q.title,
      q.body,
      q.type,
      q.choices,
      q.difficulty,
      q.tags
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = @exam_id
    ORDER BY eq.sequence ASC;
  `);

  exam.questions = questionsResult.recordset;
  return exam;
}

// List đề theo giáo viên tạo
export async function getExamsByCreator({ creatorId, search, page, pageSize }) {
  await poolConnect;
  const request = pool.request();

  const offset = (page - 1) * pageSize;

  request.input('created_by', sql.UniqueIdentifier, creatorId);
  request.input('search', sql.NVarChar(255), search || null);
  request.input('limit', sql.Int, pageSize);
  request.input('offset', sql.Int, offset);

  const result = await request.query(`
    SELECT
      e.id,
      e.title,
      e.description,
      e.duration_minutes,
      e.passing_score,
      e.randomize_questions,
      e.published,
      e.created_at
    FROM exams e
    WHERE e.created_by = @created_by
      AND (@search IS NULL OR e.title LIKE '%' + @search + '%')
    ORDER BY e.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);

  return result.recordset;
}

// Update exam + list câu hỏi (transaction)
export async function updateExamWithQuestions({
  examId,
  courseId,
  title,
  description,
  durationMinutes,
  passingScore,
  randomizeQuestions,
  questions
}) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const examReq = new sql.Request(transaction);
    examReq.input('id', sql.UniqueIdentifier, examId);
    examReq.input('course_id', sql.UniqueIdentifier, courseId || null);
    examReq.input('title', sql.NVarChar(255), title);
    examReq.input('description', sql.NVarChar(sql.MAX), description || null);
    examReq.input('duration_minutes', sql.Int, durationMinutes || null);
    examReq.input('passing_score', sql.Decimal(5, 2), passingScore ?? null);
    examReq.input(
      'randomize_questions',
      sql.Bit,
      randomizeQuestions ? 1 : 0
    );

    const examResult = await examReq.query(`
      UPDATE exams
      SET
        course_id = @course_id,
        title = @title,
        description = @description,
        duration_minutes = @duration_minutes,
        passing_score = @passing_score,
        randomize_questions = @randomize_questions,
        updated_at = SYSDATETIMEOFFSET()
      OUTPUT inserted.*
      WHERE id = @id;
    `);

    const exam = examResult.recordset[0];

    // Xoá các exam_questions cũ
    let qReq = new sql.Request(transaction);
    qReq.input('exam_id', sql.UniqueIdentifier, examId);
    await qReq.query(`
      DELETE FROM exam_questions
      WHERE exam_id = @exam_id;
    `);

    // Insert lại list câu hỏi
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];

      qReq = new sql.Request(transaction);
      qReq.input('exam_id', sql.UniqueIdentifier, examId);
      qReq.input('question_id', sql.UniqueIdentifier, q.questionId);
      qReq.input('points', sql.Decimal(6, 2), q.points ?? 1);
      qReq.input('sequence', sql.Int, q.sequence ?? i + 1);

      await qReq.query(`
        INSERT INTO exam_questions (exam_id, question_id, points, sequence)
        VALUES (@exam_id, @question_id, @points, @sequence);
      `);
    }

    await transaction.commit();
    return exam;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Publish / unpublish exam
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

// Xoá cứng exam (basic) – chú ý nếu đã có submissions
export async function deleteExamById(examId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, examId);

  await request.query(`
    DELETE FROM exams
    WHERE id = @id;
  `);
}
