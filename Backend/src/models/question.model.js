// src/models/question.model.js
// Các hàm thao tác với bảng questions

import { sql, pool, poolConnect } from '../config/db.js';

// Tạo câu hỏi mới
export async function createQuestion({
  authorId,
  title,
  body,
  type,
  choicesJson,
  difficulty,
  tagsJson
}) {
  await poolConnect;
  const request = pool.request();

  request.input('author_id', sql.UniqueIdentifier, authorId);
  request.input('title', sql.NVarChar(255), title || null);
  request.input('body', sql.NVarChar(sql.MAX), body || null);
  request.input('type', sql.NVarChar(20), type);
  request.input('choices', sql.NVarChar(sql.MAX), choicesJson || null);
  request.input('difficulty', sql.SmallInt, difficulty ?? null);
  request.input('tags', sql.NVarChar(sql.MAX), tagsJson || null);

  const result = await request.query(`
    INSERT INTO questions (author_id, title, body, type, choices, difficulty, tags)
    OUTPUT inserted.*
    VALUES (@author_id, @title, @body, @type, @choices, @difficulty, @tags);
  `);

  return result.recordset[0];
}

// Lấy danh sách câu hỏi theo giáo viên (author)
export async function getQuestionsByAuthor({
  authorId,
  search,
  type,
  page,
  pageSize
}) {
  await poolConnect;
  const request = pool.request();

  const offset = (page - 1) * pageSize;

  request.input('author_id', sql.UniqueIdentifier, authorId);
  request.input('search', sql.NVarChar(255), search || null);
  request.input('type', sql.NVarChar(20), type || null);
  request.input('limit', sql.Int, pageSize);
  request.input('offset', sql.Int, offset);

  const result = await request.query(`
    SELECT 
      q.id,
      q.title,
      q.body,
      q.type,
      q.choices,
      q.difficulty,
      q.tags,
      q.created_at,
      q.updated_at
    FROM questions q
    WHERE q.author_id = @author_id
      AND (@type IS NULL OR q.type = @type)
      AND (
        @search IS NULL 
        OR q.title LIKE '%' + @search + '%'
        OR q.body LIKE '%' + @search + '%'
      )
    ORDER BY q.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `);

  return result.recordset;
}

// Lấy 1 câu hỏi theo id (dùng cho GV/Admin, không filter author ở đây)
export async function getQuestionById(id) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, id);

  const result = await request.query(`
    SELECT *
    FROM questions
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// Update câu hỏi (title/body/type/choices/difficulty/tags)
export async function updateQuestionById(id, payload) {
  await poolConnect;
  const request = pool.request();

  request.input('id', sql.UniqueIdentifier, id);
  request.input('title', sql.NVarChar(255), payload.title || null);
  request.input('body', sql.NVarChar(sql.MAX), payload.body || null);
  request.input('type', sql.NVarChar(20), payload.type);
  request.input(
    'choices',
    sql.NVarChar(sql.MAX),
    payload.choicesJson || null
  );
  request.input(
    'difficulty',
    sql.SmallInt,
    payload.difficulty ?? null
  );
  request.input('tags', sql.NVarChar(sql.MAX), payload.tagsJson || null);

  const result = await request.query(`
    UPDATE questions
    SET
      title = @title,
      body = @body,
      type = @type,
      choices = @choices,
      difficulty = @difficulty,
      tags = @tags,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT inserted.*
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// Xoá cứng câu hỏi (basic) – cẩn thận nếu đã gắn vào exam
export async function deleteQuestionById(id) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, id);

  await request.query(`
    DELETE FROM questions
    WHERE id = @id;
  `);
}
