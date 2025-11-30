// src/models/course.model.js
// Các hàm thao tác với bảng courses

import { sql, pool, poolConnect } from "../config/db.js";

// Tìm tất cả courses với phân trang và tìm kiếm
export async function findAllCourses({
  search,
  published,
  page = 1,
  pageSize = 20,
}) {
  await poolConnect;
  const request = pool.request();

  let whereClause = "1 = 1";

  if (search) {
    request.input("search", sql.NVarChar(255), `%${search}%`);
    whereClause +=
      " AND (title LIKE @search OR short_description LIKE @search)";
  }

  if (published !== undefined) {
    request.input("published", sql.Bit, published);
    whereClause += " AND published = @published";
  }

  const offset = (page - 1) * pageSize;
  request.input("offset", sql.Int, offset);
  request.input("pageSize", sql.Int, pageSize);

  const result = await request.query(`
    SELECT 
      id, slug, title, short_description, description, 
      price, currency, creator_id, published, published_at,
      created_at, updated_at
    FROM courses 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY
  `);

  // Đếm tổng số records
  const countRequest = pool.request();
  if (search) countRequest.input("search", sql.NVarChar(255), `%${search}%`);
  if (published !== undefined)
    countRequest.input("published", sql.Bit, published);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) as total FROM courses WHERE ${whereClause}
  `);

  return {
    courses: result.recordset,
    total: countResult.recordset[0].total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.recordset[0].total / pageSize),
  };
}

// Tìm course theo ID
export async function findCourseById(courseId) {
  await poolConnect;
  const request = pool.request();
  request.input("id", sql.UniqueIdentifier, courseId);

  const result = await request.query(`
    SELECT 
      id, slug, title, short_description, description, 
      price, currency, creator_id, published, published_at,
      created_at, updated_at
    FROM courses
    WHERE id = @id
  `);

  return result.recordset[0] || null;
}

// Tạo course mới
export async function createCourse(courseData) {
  await poolConnect;
  const request = pool.request();

  request.input("slug", sql.NVarChar(255), courseData.slug);
  request.input("title", sql.NVarChar(255), courseData.title);
  request.input(
    "short_description",
    sql.NVarChar(sql.MAX),
    courseData.short_description
  );
  request.input("description", sql.NVarChar(sql.MAX), courseData.description);
  request.input("price", sql.Decimal(10, 2), courseData.price);
  request.input("currency", sql.NVarChar(3), courseData.currency || "USD");
  request.input("creator_id", sql.UniqueIdentifier, courseData.creator_id);
  request.input("published", sql.Bit, courseData.published || false);

  const result = await request.query(`
    INSERT INTO courses (
      slug, title, short_description, description, price, 
      currency, creator_id, published, published_at
    )
    OUTPUT 
      inserted.id, inserted.slug, inserted.title, 
      inserted.short_description, inserted.description,
      inserted.price, inserted.currency, inserted.creator_id,
      inserted.published, inserted.published_at,
      inserted.created_at, inserted.updated_at
    VALUES (
      @slug, @title, @short_description, @description, @price,
      @currency, @creator_id, @published,
      CASE WHEN @published = 1 THEN SYSDATETIMEOFFSET() ELSE NULL END
    );
  `);

  return result.recordset[0];
}

// Cập nhật course
export async function updateCourse(courseId, courseData) {
  await poolConnect;
  const request = pool.request();

  request.input("id", sql.UniqueIdentifier, courseId);
  request.input("slug", sql.NVarChar(255), courseData.slug);
  request.input("title", sql.NVarChar(255), courseData.title);
  request.input(
    "short_description",
    sql.NVarChar(sql.MAX),
    courseData.short_description
  );
  request.input("description", sql.NVarChar(sql.MAX), courseData.description);
  request.input("price", sql.Decimal(10, 2), courseData.price);
  request.input("currency", sql.NVarChar(3), courseData.currency);
  request.input("published", sql.Bit, courseData.published);

  const result = await request.query(`
    UPDATE courses 
    SET 
      slug = @slug,
      title = @title,
      short_description = @short_description,
      description = @description,
      price = @price,
      currency = @currency,
      published = @published,
      published_at = CASE 
        WHEN @published = 1 AND published_at IS NULL 
        THEN SYSDATETIMEOFFSET() 
        WHEN @published = 0 
        THEN NULL
        ELSE published_at 
      END,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT 
      inserted.id, inserted.slug, inserted.title,
      inserted.short_description, inserted.description,
      inserted.price, inserted.currency, inserted.creator_id,
      inserted.published, inserted.published_at,
      inserted.created_at, inserted.updated_at
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// Xóa course
export async function deleteCourse(courseId) {
  await poolConnect;
  const request = pool.request();
  request.input("id", sql.UniqueIdentifier, courseId);

  const result = await request.query(`
    DELETE FROM courses 
    WHERE id = @id
  `);

  return result.rowsAffected[0] > 0;
}

// Kiểm tra slug đã tồn tại chưa
export async function checkSlugExists(slug, excludeId = null) {
  await poolConnect;
  const request = pool.request();
  request.input("slug", sql.NVarChar(255), slug);

  let whereClause = "slug = @slug";
  if (excludeId) {
    request.input("excludeId", sql.UniqueIdentifier, excludeId);
    whereClause += " AND id != @excludeId";
  }

  const result = await request.query(`
    SELECT COUNT(*) as count FROM courses WHERE ${whereClause}
  `);

  return result.recordset[0].count > 0;
}
