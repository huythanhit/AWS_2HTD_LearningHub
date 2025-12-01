// src/models/submission.model.js
import { sql, pool, poolConnect } from '../config/db.js';

// Tạo lượt làm bài (submission) mới cho 1 học sinh
export async function createSubmission({ examId, userId, autoGraded = true }) {
  await poolConnect;
  const request = pool.request();

  request.input('exam_id', sql.UniqueIdentifier, examId);
  request.input('user_id', sql.UniqueIdentifier, userId);
  request.input('auto_graded', sql.Bit, autoGraded ? 1 : 0);

  const result = await request.query(`
    INSERT INTO submissions (exam_id, user_id, auto_graded)
    OUTPUT inserted.*
    VALUES (@exam_id, @user_id, @auto_graded);
  `);

  return result.recordset[0];
}

// Lấy thông tin 1 submission
export async function getSubmissionById(submissionId) {
  await poolConnect;
  const request = pool.request();

  request.input('id', sql.UniqueIdentifier, submissionId);

  const result = await request.query(`
    SELECT *
    FROM submissions
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// Lưu kết quả chấm điểm: cập nhật submissions + các submission_items
export async function saveSubmissionGrading({
  submissionId,
  items,
  totalScore,
  resultSummary
}) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Xoá các item cũ (nếu có) để tránh trùng
    let request = new sql.Request(transaction);
    request.input('submission_id', sql.UniqueIdentifier, submissionId);
    await request.query(`
      DELETE FROM submission_items
      WHERE submission_id = @submission_id;
    `);

    // Thêm từng câu trả lời
    for (const item of items) {
      const itemReq = new sql.Request(transaction);
      itemReq.input('submission_id', sql.UniqueIdentifier, submissionId);
      itemReq.input('question_id', sql.UniqueIdentifier, item.questionId);
      itemReq.input('answer', sql.NVarChar(sql.MAX), item.answerJson);
      itemReq.input(
        'awarded_points',
        sql.Decimal(6, 2),
        item.awardedPoints ?? 0
      );
      itemReq.input('graded', sql.Bit, item.graded ? 1 : 0);

      await itemReq.query(`
        INSERT INTO submission_items (
          submission_id,
          question_id,
          answer,
          awarded_points,
          graded
        )
        VALUES (
          @submission_id,
          @question_id,
          @answer,
          @awarded_points,
          @graded
        );
      `);
    }

    // Cập nhật tổng điểm và trạng thái submission
    const updateReq = new sql.Request(transaction);
    updateReq.input('submission_id', sql.UniqueIdentifier, submissionId);
    updateReq.input('total_score', sql.Decimal(8, 2), totalScore);
    updateReq.input(
      'result',
      sql.NVarChar(sql.MAX),
      JSON.stringify(resultSummary)
    );

    await updateReq.query(`
      UPDATE submissions
      SET
        submitted_at = SYSDATETIMEOFFSET(),
        duration_seconds = DATEDIFF(SECOND, started_at, SYSDATETIMEOFFSET()),
        total_score = @total_score,
        status = N'completed',
        auto_graded = 1,
        result = @result
      WHERE id = @submission_id;
    `);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Lấy danh sách submission của 1 user (lịch sử làm bài)
export async function getSubmissionsByUser({ userId, page, pageSize }) {
  await poolConnect;
  const request = pool.request();

  const offset = (page - 1) * pageSize;

  request.input('user_id', sql.UniqueIdentifier, userId);
  request.input('limit', sql.Int, pageSize);
  request.input('offset', sql.Int, offset);

  const result = await request.query(`
    SELECT
      s.id,
      s.exam_id,
      s.total_score,
      s.status,
      s.started_at,
      s.submitted_at,
      s.result,
      e.title AS exam_title
    FROM submissions s
    LEFT JOIN exams e ON e.id = s.exam_id
    WHERE s.user_id = @user_id
    ORDER BY s.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);

  return result.recordset;
}

// Lấy full thông tin 1 submission + chi tiết từng câu
export async function getSubmissionWithDetails(submissionId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, submissionId);

  // Thông tin submission + exam
  const subResult = await request.query(`
    SELECT
      s.*,
      e.title AS exam_title,
      e.passing_score,
      e.duration_minutes
    FROM submissions s
    LEFT JOIN exams e ON e.id = s.exam_id
    WHERE s.id = @id;
  `);

  const submission = subResult.recordset[0];
  if (!submission) return null;

  // Chi tiết từng câu
  request.input('exam_id', sql.UniqueIdentifier, submission.exam_id);

  const itemsResult = await request.query(`
    SELECT
      si.id,
      si.question_id,
      si.answer,
      si.awarded_points,
      si.graded,
      q.title,
      q.body,
      q.type,
      q.choices,
      q.tags,
      eq.points,
      eq.sequence
    FROM submission_items si
    JOIN questions q ON q.id = si.question_id
    LEFT JOIN exam_questions eq
      ON eq.exam_id = @exam_id AND eq.question_id = q.id
    WHERE si.submission_id = @id
    ORDER BY eq.sequence ASC;
  `);

  submission.items = itemsResult.recordset;
  return submission;
}
