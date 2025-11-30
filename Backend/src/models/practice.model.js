// src/models/practice.model.js
import sql from 'mssql';
import { getPool } from '../config/db.js';

function buildFiltersQuery(baseQuery, request, filters) {
  let query = baseQuery;

  if (filters?.category) {
    query += ' AND category = @category';
    request.input('category', sql.NVarChar(50), filters.category);
  }
  if (filters?.topic) {
    query += ' AND topic = @topic';
    request.input('topic', sql.NVarChar(255), filters.topic);
  }
  if (filters?.courseId) {
    query += ' AND course_id = @courseId';
    request.input('courseId', sql.UniqueIdentifier, filters.courseId);
  }
  if (filters?.language) {
    query += ' AND language = @language';
    request.input('language', sql.NVarChar(20), filters.language);
  }

  return query;
}

// ===== PRACTICE SETS =====

export async function createPracticeSet(ownerId, payload) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('owner_id', sql.UniqueIdentifier, ownerId)
    .input('title', sql.NVarChar(255), payload.title)
    .input('description', sql.NVarChar(sql.MAX), payload.description || null)
    .input('category', sql.NVarChar(50), payload.category)
    .input('topic', sql.NVarChar(255), payload.topic)
    .input('language', sql.NVarChar(20), payload.language || null)
    .input('course_id', sql.UniqueIdentifier, payload.courseId || null)
    .input('published', sql.Bit, payload.published ?? 0);

  const result = await request.query(`
    INSERT INTO flashcard_decks (
      owner_id, title, description, category, topic,
      language, course_id, published
    )
    OUTPUT INSERTED.*
    VALUES (
      @owner_id, @title, @description, @category, @topic,
      @language, @course_id, @published
    );
  `);

  return result.recordset[0];
}

export async function updatePracticeSet(setId, ownerId, payload, isAdmin = false) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('set_id', sql.UniqueIdentifier, setId)
    .input('owner_id', sql.UniqueIdentifier, ownerId)
    .input('title', sql.NVarChar(255), payload.title ?? null)
    .input('description', sql.NVarChar(sql.MAX), payload.description ?? null)
    .input('category', sql.NVarChar(50), payload.category ?? null)
    .input('topic', sql.NVarChar(255), payload.topic ?? null)
    .input('language', sql.NVarChar(20), payload.language ?? null)
    .input('course_id', sql.UniqueIdentifier, payload.courseId ?? null)
    .input(
      'published',
      sql.Bit,
      typeof payload.published === 'boolean' ? payload.published : null
    );

  let whereOwner = '';
  if (!isAdmin) {
    whereOwner = ' AND owner_id = @owner_id';
  }

  const result = await request.query(`
    UPDATE flashcard_decks
    SET
      title       = COALESCE(@title, title),
      description = COALESCE(@description, description),
      category    = COALESCE(@category, category),
      topic       = COALESCE(@topic, topic),
      language    = COALESCE(@language, language),
      course_id   = COALESCE(@course_id, course_id),
      published   = COALESCE(@published, published)
    OUTPUT INSERTED.*
    WHERE id = @set_id${whereOwner};
  `);

  return result.recordset[0];
}

export async function getPracticeSetById(setId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('set_id', sql.UniqueIdentifier, setId);

  const result = await request.query(`
    SELECT * FROM flashcard_decks WHERE id = @set_id;
  `);
  return result.recordset[0];
}

export async function listMyPracticeSets(ownerId, filters = {}) {
  const pool = await getPool();
  const request = pool.request();
  request.input('owner_id', sql.UniqueIdentifier, ownerId);

  let query = `
    SELECT *
    FROM flashcard_decks
    WHERE owner_id = @owner_id
  `;

  query = buildFiltersQuery(query, request, filters);

  const result = await request.query(query);
  return result.recordset;
}

export async function listPublishedPracticeSets(filters = {}) {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT *
    FROM flashcard_decks
    WHERE published = 1
  `;

  query = buildFiltersQuery(query, request, filters);

  const result = await request.query(query);
  return result.recordset;
}

// ===== CARDS =====

export async function listPracticeCardsBySet(setId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('set_id', sql.UniqueIdentifier, setId);

  const result = await request.query(`
    SELECT *
    FROM flashcards
    WHERE deck_id = @set_id
    ORDER BY order_index ASC, created_at ASC;
  `);

  return result.recordset;
}

export async function createPracticeCard(setId, payload) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('set_id', sql.UniqueIdentifier, setId)
    .input('front', sql.NVarChar(sql.MAX), payload.front)
    .input('back', sql.NVarChar(sql.MAX), payload.back)
    .input('example', sql.NVarChar(sql.MAX), payload.example || null)
    .input('image_s3_key', sql.NVarChar(sql.MAX), payload.imageS3Key || null)
    .input('audio_s3_key', sql.NVarChar(sql.MAX), payload.audioS3Key || null)
    .input('order_index', sql.Int, payload.orderIndex ?? 0);

  const result = await request.query(`
    INSERT INTO flashcards (
      deck_id, front, back, example, image_s3_key, audio_s3_key, order_index
    )
    OUTPUT INSERTED.*
    VALUES (
      @set_id, @front, @back, @example, @image_s3_key, @audio_s3_key, @order_index
    );
  `);

  return result.recordset[0];
}

export async function updatePracticeCard(cardId, payload) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('card_id', sql.UniqueIdentifier, cardId)
    .input('front', sql.NVarChar(sql.MAX), payload.front ?? null)
    .input('back', sql.NVarChar(sql.MAX), payload.back ?? null)
    .input('example', sql.NVarChar(sql.MAX), payload.example ?? null)
    .input('image_s3_key', sql.NVarChar(sql.MAX), payload.imageS3Key ?? null)
    .input('audio_s3_key', sql.NVarChar(sql.MAX), payload.audioS3Key ?? null)
    .input('order_index', sql.Int, payload.orderIndex ?? null);

  const result = await request.query(`
    UPDATE flashcards
    SET
      front        = COALESCE(@front, front),
      back         = COALESCE(@back, back),
      example      = COALESCE(@example, example),
      image_s3_key = COALESCE(@image_s3_key, image_s3_key),
      audio_s3_key = COALESCE(@audio_s3_key, audio_s3_key),
      order_index  = COALESCE(@order_index, order_index)
    OUTPUT INSERTED.*
    WHERE id = @card_id;
  `);

  return result.recordset[0];
}

export async function deletePracticeCard(cardId) {
  const pool = await getPool();
  const request = pool.request();
  request.input('card_id', sql.UniqueIdentifier, cardId);

  await request.query(`
    DELETE FROM flashcards WHERE id = @card_id;
  `);
}

// ===== PROGRESS / STUDY =====

export async function getDuePracticeCardsForUser(setId, userId, limit = 20) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('set_id', sql.UniqueIdentifier, setId)
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT TOP (@limit) f.*
    FROM flashcards f
    LEFT JOIN flashcard_progress p
      ON p.flashcard_id = f.id AND p.user_id = @user_id
    WHERE f.deck_id = @set_id
      AND (
        p.id IS NULL
        OR p.next_review_at IS NULL
        OR p.next_review_at <= SYSDATETIMEOFFSET()
      )
    ORDER BY p.next_review_at ASC, f.order_index ASC;
  `);

  return result.recordset;
}

export async function upsertPracticeCardProgress(userId, cardId, update) {
  const pool = await getPool();
  const request = pool.request();

  request
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('card_id', sql.UniqueIdentifier, cardId)
    .input('efactor', sql.Decimal(5, 2), update.efactor)
    .input('interval_days', sql.Int, update.intervalDays)
    .input('next_review_at', sql.DateTimeOffset, update.nextReviewAt)
    .input('ease_count', sql.Int, update.easeCount);

  await request.query(`
    MERGE flashcard_progress AS target
    USING (SELECT @user_id AS user_id, @card_id AS flashcard_id) AS src
    ON target.user_id = src.user_id AND target.flashcard_id = src.flashcard_id
    WHEN MATCHED THEN
      UPDATE SET
        efactor       = @efactor,
        interval_days = @interval_days,
        next_review_at= @next_review_at,
        ease_count    = @ease_count
    WHEN NOT MATCHED THEN
      INSERT (user_id, flashcard_id, efactor, interval_days, next_review_at, ease_count)
      VALUES (@user_id, @card_id, @efactor, @interval_days, @next_review_at, @ease_count);
  `);
}
