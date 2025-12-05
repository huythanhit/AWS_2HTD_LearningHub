// src/services/course.service.js
import { sql, getRequest } from "../config/db.js";
import { 
  createNotification, 
  createNotificationsForUsers 
} from "./notification.service.js";

// ================== ADMIN / TEACHER ==================
// Lấy danh sách course cho Admin/Teacher (kèm danh sách teachers)
export const getAdminCoursesService = async (creatorId, isAdmin) => {
  const request = await getRequest();

  let query = `
    SELECT
      c.id AS courseId,
      c.slug,
      c.title,
      c.short_description AS shortDescription,
      c.description,
      c.price,
      c.currency,
      c.creator_id AS creatorId,
      c.published,
      c.published_at AS publishedAt,
      c.created_at AS createdAt,
      u.id AS teacherId,
      COALESCE(up.full_name, u.email) AS teacherName
    FROM courses c
    LEFT JOIN course_teachers ct ON ct.course_id = c.id
    LEFT JOIN users u ON u.id = ct.teacher_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
  `;

  // Nếu là Teacher thì chỉ xem course mình tạo
  if (!isAdmin) {
    request.input("CreatorId", sql.UniqueIdentifier, creatorId);
    query += `
      WHERE c.creator_id = @CreatorId
    `;
  }

  query += `
    ORDER BY c.created_at DESC;
  `;

  const result = await request.query(query);
  const rows = result.recordset;

  // Gom nhiều dòng (do JOIN) thành 1 course + mảng teachers
  const courseMap = new Map();

  for (const row of rows) {
    let course = courseMap.get(row.courseId);
    if (!course) {
      course = {
        courseId: row.courseId,
        slug: row.slug,
        title: row.title,
        shortDescription: row.shortDescription,
        description: row.description,
        price: row.price,
        currency: row.currency,
        creatorId: row.creatorId,
        published: row.published,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        teachers: [],
      };
      courseMap.set(row.courseId, course);
    }

    if (row.teacherId) {
      course.teachers.push({
        teacherId: row.teacherId,
        fullName: row.teacherName,
      });
    }
  }

  return Array.from(courseMap.values());
};


// Lấy 1 course (cho mục đích check owner / update / delete)
export const getCourseByIdService = async (courseId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);

  // Lấy thông tin course
  const result = await request.query(`
    SELECT 
      id AS courseId,
      slug,
      title,
      short_description AS shortDescription,
      description,
      price,
      currency,
      creator_id AS creatorId,
      published,
      published_at AS publishedAt,
      created_at AS createdAt
    FROM courses
    WHERE id = @CourseId;
  `);

  if (result.recordset.length === 0) return null;

  const course = result.recordset[0];

  // Lấy danh sách teacher của course
  const teachersResult = await request.query(`
    SELECT 
      u.id AS teacherId,
      COALESCE(up.full_name, u.email) AS fullName, 
      u.email
    FROM course_teachers ct
    JOIN users u ON u.id = ct.teacher_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE ct.course_id = @CourseId;
  `);

  course.teachers = teachersResult.recordset;

  return course;
};


// Tạo course mới
export const createCourseService = async (creatorId, payload) => {
  const {
    slug,
    title,
    shortDescription,
    description,
    price,
    currency,
    published,
  } = payload;

  const request = await getRequest();

  const isPublished = published === true || published === 1;
  const publishedAt = isPublished ? new Date() : null;

  request.input("Slug", sql.NVarChar(255), slug);
  request.input("Title", sql.NVarChar(255), title);
  request.input(
    "ShortDescription",
    sql.NVarChar(sql.MAX),
    shortDescription || null
  );
  request.input("Description", sql.NVarChar(sql.MAX), description || null);
  request.input("Price", sql.Decimal(10, 2), price ?? 0);
  request.input("Currency", sql.NVarChar(3), currency || "USD");
  request.input("CreatorId", sql.UniqueIdentifier, creatorId);
  request.input("Published", sql.Bit, isPublished);
  request.input("PublishedAt", sql.DateTimeOffset, publishedAt);

  const result = await request.query(`
    INSERT INTO courses (
      slug,
      title,
      short_description,
      description,
      price,
      currency,
      creator_id,
      published,
      published_at
    )
    OUTPUT
      INSERTED.id AS courseId,
      INSERTED.slug,
      INSERTED.title,
      INSERTED.short_description AS shortDescription,
      INSERTED.description,
      INSERTED.price,
      INSERTED.currency,
      INSERTED.creator_id AS creatorId,
      INSERTED.published,
      INSERTED.published_at AS publishedAt,
      INSERTED.created_at AS createdAt
    VALUES (
      @Slug,
      @Title,
      @ShortDescription,
      @Description,
      @Price,
      @Currency,
      @CreatorId,
      @Published,
      @PublishedAt
    );
  `);

  return result.recordset[0];
};

// Update course (payload đã merge sẵn)
export const updateCourseService = async (courseId, payload) => {
  const {
    slug,
    title,
    shortDescription,
    description,
    price,
    currency,
    published,
    publishedAt,
  } = payload;

  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("Slug", sql.NVarChar(255), slug);
  request.input("Title", sql.NVarChar(255), title);
  request.input(
    "ShortDescription",
    sql.NVarChar(sql.MAX),
    shortDescription || null
  );
  request.input("Description", sql.NVarChar(sql.MAX), description || null);
  request.input("Price", sql.Decimal(10, 2), price ?? 0);
  request.input("Currency", sql.NVarChar(3), currency || "USD");
  request.input("Published", sql.Bit, published ? 1 : 0);
  request.input("PublishedAt", sql.DateTimeOffset, publishedAt);

  const result = await request.query(`
    UPDATE courses
    SET
      slug = @Slug,
      title = @Title,
      short_description = @ShortDescription,
      description = @Description,
      price = @Price,
      currency = @Currency,
      published = @Published,
      published_at = @PublishedAt
    OUTPUT
      INSERTED.id AS courseId,
      INSERTED.slug,
      INSERTED.title,
      INSERTED.short_description AS shortDescription,
      INSERTED.description,
      INSERTED.price,
      INSERTED.currency,
      INSERTED.creator_id AS creatorId,
      INSERTED.published,
      INSERTED.published_at AS publishedAt,
      INSERTED.created_at AS createdAt
    WHERE id = @CourseId;
  `);

  if (result.recordset.length === 0) return null;
  return result.recordset[0];
};

// Delete course
export const deleteCourseService = async (courseId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);

  const result = await request.query(`
    DELETE FROM courses
    WHERE id = @CourseId;
  `);

  // rowsAffected là mảng, phần tử đầu tiên là số dòng xóa
  return result.rowsAffected[0] || 0;
};

// Tạo lecture cho 1 course
export const createLectureService = async (courseId, payload) => {
  const {
    title,
    contentType,
    s3Key,
    durationSeconds,
    orderIndex,
    published,
  } = payload;

  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("Title", sql.NVarChar(255), title);
  request.input("ContentType", sql.NVarChar(20), contentType || "video");
  request.input("S3Key", sql.NVarChar(sql.MAX), s3Key || null);
  request.input("DurationSeconds", sql.Int, durationSeconds ?? null);
  request.input("OrderIndex", sql.Int, orderIndex ?? 0);
  request.input("Published", sql.Bit, published === false ? 0 : 1);

  const result = await request.query(`
    INSERT INTO lectures (
      course_id,
      title,
      content_type,
      s3_key,
      duration_seconds,
      order_index,
      published
    )
    OUTPUT
      INSERTED.id AS lectureId,
      INSERTED.course_id AS courseId,
      INSERTED.title,
      INSERTED.content_type AS contentType,
      INSERTED.s3_key AS s3Key,
      INSERTED.duration_seconds AS durationSeconds,
      INSERTED.order_index AS orderIndex,
      INSERTED.published,
      INSERTED.created_at AS createdAt
    VALUES (
      @CourseId,
      @Title,
      @ContentType,
      @S3Key,
      @DurationSeconds,
      @OrderIndex,
      @Published
    );
  `);

  const lecture = result.recordset[0];

  // ===== NOTIFICATION: NEW_LECTURE cho các member đã enroll khóa học =====
  if (lecture.published) {
    // Lấy title khóa học
    const courseReq = await getRequest();
    courseReq.input("CourseId", sql.UniqueIdentifier, courseId);
    const courseRes = await courseReq.query(`
      SELECT title
      FROM courses
      WHERE id = @CourseId;
    `);
    const courseTitle =
      courseRes.recordset.length > 0 ? courseRes.recordset[0].title : null;

    // Lấy danh sách member active
    const enrollReq = await getRequest();
    enrollReq.input("CourseId", sql.UniqueIdentifier, courseId);
    const enrollRes = await enrollReq.query(`
      SELECT user_id
      FROM enrollments
      WHERE course_id = @CourseId AND status = N'active';
    `);

    const userIds = enrollRes.recordset.map((r) => r.user_id);

    if (userIds.length > 0) {
      await createNotificationsForUsers({
        userIds,
        type: "NEW_LECTURE",
        payloadBuilder: (userId) => ({
          courseId,
          courseTitle,
          lectureId: lecture.lectureId,
          lectureTitle: lecture.title,
        }),
      });
    }
  }

  return lecture;
};

// Lấy danh sách lectures của 1 course (cho Admin/Teacher quản lý nội dung)
export const getCourseLecturesService = async (courseId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);

  const result = await request.query(`
    SELECT 
      id AS lectureId,
      course_id AS courseId,
      title,
      content_type AS contentType,
      s3_key AS s3Key,
      duration_seconds AS durationSeconds,
      order_index AS orderIndex,
      published,
      created_at AS createdAt
    FROM lectures
    WHERE course_id = @CourseId
    ORDER BY order_index ASC, created_at ASC;
  `);

  return result.recordset;
};

// Update lecture
export const updateLectureService = async (courseId, lectureId, payload) => {
  const {
    title,
    contentType,
    s3Key,
    durationSeconds,
    orderIndex,
    published,
  } = payload;

  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("LectureId", sql.UniqueIdentifier, lectureId);
  request.input("Title", sql.NVarChar(255), title ?? null);
  request.input("ContentType", sql.NVarChar(20), contentType ?? null);
  request.input("S3Key", sql.NVarChar(sql.MAX), s3Key ?? null);
  request.input("DurationSeconds", sql.Int, durationSeconds ?? null);
  request.input("OrderIndex", sql.Int, orderIndex ?? null);
  request.input(
    "Published",
    sql.Bit,
    typeof published === "boolean" ? (published ? 1 : 0) : null
  );

  const result = await request.query(`
    UPDATE lectures
    SET
      title = ISNULL(@Title, title),
      content_type = ISNULL(@ContentType, content_type),
      s3_key = ISNULL(@S3Key, s3_key),
      duration_seconds = ISNULL(@DurationSeconds, duration_seconds),
      order_index = ISNULL(@OrderIndex, order_index),
      published = ISNULL(@Published, published)
    OUTPUT
      INSERTED.id AS lectureId,
      INSERTED.course_id AS courseId,
      INSERTED.title,
      INSERTED.content_type AS contentType,
      INSERTED.s3_key AS s3Key,
      INSERTED.duration_seconds AS durationSeconds,
      INSERTED.order_index AS orderIndex,
      INSERTED.published,
      INSERTED.created_at AS createdAt
    WHERE id = @LectureId AND course_id = @CourseId;
  `);

  if (result.recordset.length === 0) return null;
  return result.recordset[0];
};

// Delete lecture (xoá cả lecture_progress liên quan)
export const deleteLectureService = async (courseId, lectureId) => {
  // xoá progress trước để tránh lỗi FK
  let request = await getRequest();
  request.input("LectureId", sql.UniqueIdentifier, lectureId);
  await request.query(`
    DELETE FROM lecture_progress WHERE lecture_id = @LectureId;
  `);

  // xoá lecture
  request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("LectureId", sql.UniqueIdentifier, lectureId);

  const result = await request.query(`
    DELETE FROM lectures
    WHERE id = @LectureId AND course_id = @CourseId;
  `);

  return result.rowsAffected[0] || 0;
};

// ================== PUBLIC / MEMBER ==================

// Lấy list khóa học đã publish
export const getPublishedCoursesService = async () => {
  const request = await getRequest();
  const result = await request.query(`
    SELECT 
      id AS courseId,
      slug,
      title,
      short_description AS shortDescription,
      price,
      currency,
      published,
      published_at AS publishedAt
    FROM courses
    WHERE published = 1
    ORDER BY created_at DESC;
  `);
  return result.recordset;
};

// Lấy chi tiết 1 khóa học (chỉ course đã publish)
export const getCourseDetailService = async (courseId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);

  const result = await request.query(`
    SELECT 
      id AS courseId,
      slug,
      title,
      short_description AS shortDescription,
      description,
      price,
      currency,
      published,
      published_at AS publishedAt,
      created_at AS createdAt
    FROM courses
    WHERE id = @CourseId AND published = 1;
  `);

  if (result.recordset.length === 0) return null;

  const course = result.recordset[0];

  // Lấy teachers cho course public (dùng user_profiles)
  const teachersResult = await request.query(`
    SELECT 
      u.id AS teacherId,
      COALESCE(up.full_name, u.email) AS fullName,
      u.email
    FROM course_teachers ct
    JOIN users u ON u.id = ct.teacher_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE ct.course_id = @CourseId;
  `);

  course.teachers = teachersResult.recordset;

  const lecturesResult = await request.query(`
    SELECT 
      id AS lectureId,
      title,
      content_type AS contentType,
      s3_key AS s3Key,
      duration_seconds AS durationSeconds,
      order_index AS orderIndex,
      published
    FROM lectures
    WHERE course_id = @CourseId
    ORDER BY order_index ASC, created_at ASC;
  `);

  course.lectures = lecturesResult.recordset;

  return course;
};

// Member enroll khóa học
export const enrollCourseService = async (userId, courseId) => {
  const request = await getRequest();
  request.input("UserId", sql.UniqueIdentifier, userId);
  request.input("CourseId", sql.UniqueIdentifier, courseId);

  // Lấy thêm title + creator_id để dùng cho notification
  const checkCourse = await request.query(`
    SELECT TOP 1 id, title, creator_id
    FROM courses
    WHERE id = @CourseId AND published = 1;
  `);

  if (checkCourse.recordset.length === 0) {
    const error = new Error("COURSE_NOT_FOUND");
    error.code = "COURSE_NOT_FOUND";
    throw error;
  }

  const courseInfo = checkCourse.recordset[0];

  // Kiểm tra đã enroll chưa
  const checkEnroll = await request.query(`
    SELECT TOP 1 id, status, progress_percent, enrolled_at
    FROM enrollments
    WHERE user_id = @UserId AND course_id = @CourseId;
  `);

  if (checkEnroll.recordset.length > 0) {
    // ĐÃ enroll rồi thì không tạo notification nữa
    return {
      alreadyEnrolled: true,
      enrollment: checkEnroll.recordset[0],
    };
  }

  // Chưa enroll -> insert
  const insertResult = await request.query(`
    INSERT INTO enrollments (user_id, course_id)
    OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.course_id, INSERTED.enrolled_at, INSERTED.status, INSERTED.progress_percent
    VALUES (@UserId, @CourseId);
  `);
  const enrollment = insertResult.recordset[0];

  // ========== NOTIFICATION ==========

  // 1. Gửi cho Member: COURSE_ENROLL
  await createNotification({
    userId,
    type: "COURSE_ENROLL",
    payload: {
      courseId,
      courseTitle: courseInfo.title,
      enrollmentId: enrollment.id,
    },
  });

  // 2. Gửi cho Teacher(s): NEW_ENROLLMENT
  //    - Teacher chính: creator_id
  //    - Các teacher được gán thêm trong course_teachers
  const teacherRequest = await getRequest();
  teacherRequest.input("CourseId", sql.UniqueIdentifier, courseId);

  const teacherResult = await teacherRequest.query(`
    SELECT teacher_id
    FROM course_teachers
    WHERE course_id = @CourseId;
  `);

  const teacherIds = new Set();

  if (courseInfo.creator_id) {
    teacherIds.add(String(courseInfo.creator_id));
  }

  for (const row of teacherResult.recordset) {
    if (row.teacher_id) {
      teacherIds.add(String(row.teacher_id));
    }
  }

  for (const teacherId of teacherIds) {
    await createNotification({
      userId: teacherId,
      type: "NEW_ENROLLMENT",
      payload: {
        courseId,
        courseTitle: courseInfo.title,
        studentId: userId,
        enrollmentId: enrollment.id,
      },
    });
  }

  // ========== END NOTIFICATION ==========

  return {
    alreadyEnrolled: false,
    enrollment,
  };
};

// Update lecture progress (gọi stored procedure)
export const updateLectureProgressService = async (
  userId,
  courseId,
  lectureId,
  watchedSeconds,
  completed
) => {
  // 1. Lấy trạng thái cũ của enrollment (để biết có phải lần đầu completed không)
  let wasCompleted = false;
  const checkReq = await getRequest();
  checkReq.input("UserId", sql.UniqueIdentifier, userId);
  checkReq.input("CourseId", sql.UniqueIdentifier, courseId);
  const enrollCheck = await checkReq.query(`
    SELECT TOP 1 status
    FROM enrollments
    WHERE user_id = @UserId AND course_id = @CourseId;
  `);
  if (enrollCheck.recordset.length > 0) {
    wasCompleted = enrollCheck.recordset[0].status === "completed";
  }

  // 2. Gọi stored procedure như cũ
  const request = await getRequest();
  request.input("UserId", sql.UniqueIdentifier, userId);
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("LectureId", sql.UniqueIdentifier, lectureId);
  request.input("WatchedSeconds", sql.Int, watchedSeconds ?? null);
  request.input(
    "Completed",
    sql.Bit,
    typeof completed === "boolean" ? (completed ? 1 : 0) : null
  );

  const result = await request.execute(
    "dbo.sp_UpdateLectureProgressAndCourseProgress"
  );
  const row = result.recordset[0]; // { userId, courseId, lectureId, progressPercent, status }

  // 3. Nếu trước đó chưa completed mà bây giờ status = completed → bắn COURSE_COMPLETED
  if (row && row.status === "completed" && !wasCompleted) {
    const courseReq = await getRequest();
    courseReq.input("CourseId", sql.UniqueIdentifier, courseId);
    const courseRes = await courseReq.query(`
      SELECT title
      FROM courses
      WHERE id = @CourseId;
    `);
    const courseTitle =
      courseRes.recordset.length > 0 ? courseRes.recordset[0].title : null;

    await createNotification({
      userId,
      type: "COURSE_COMPLETED",
      payload: {
        courseId,
        courseTitle,
        progressPercent: row.progressPercent,
        status: row.status,
      },
    });
  }

  return row;
};


// My courses của member
export const getMyCoursesService = async (userId, statusFilter) => {
  const request = await getRequest();
  request.input("UserId", sql.UniqueIdentifier, userId);
  request.input("StatusFilter", sql.NVarChar(20), statusFilter || null);

  const result = await request.query(`
    SELECT
      c.id AS courseId,
      c.title,
      c.short_description AS shortDescription,
      e.progress_percent AS progressPercent,
      e.status,
      e.enrolled_at AS enrolledAt
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = @UserId
      AND (@StatusFilter IS NULL OR e.status = @StatusFilter)
    ORDER BY e.enrolled_at DESC;
  `);

  return result.recordset;
};

// ================== TEACHER - COURSE MAPPING ==================
// Gán 1 teacher vào course (chỉ cho phép 1 teacher / course)
export const addTeacherToCourseService = async (courseId, teacherId) => {
  const request = await getRequest();

  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("TeacherId", sql.UniqueIdentifier, teacherId);

  // 1. Check xem course đã có teacher chưa
  const existingResult = await request.query(`
    SELECT TOP 1 teacher_id
    FROM course_teachers
    WHERE course_id = @CourseId;
  `);

  if (existingResult.recordset.length > 0) {
    // Đã có teacher rồi -> báo lỗi cho controller
    const currentTeacherId = existingResult.recordset[0].teacher_id;

    const error = new Error(
      "Course already has a teacher. Remove current teacher before assigning a new one."
    );
    error.statusCode = 400;
    error.currentTeacherId = currentTeacherId;
    throw error;
  }

  // 2. Insert teacher mới
  await request.query(`
    INSERT INTO course_teachers (course_id, teacher_id)
    VALUES (@CourseId, @TeacherId);
  `);

  return {
    courseId,
    teacherId,
  };
};

// Admin bỏ gán teacher khỏi course
export const removeTeacherFromCourseService = async (courseId, teacherId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("TeacherId", sql.UniqueIdentifier, teacherId);

  const result = await request.query(`
    DELETE FROM course_teachers
    WHERE course_id = @CourseId AND teacher_id = @TeacherId;
  `);

  return result.rowsAffected[0] || 0;
};

// Teacher lấy list course mình dạy
export const getTeacherCoursesService = async (teacherId) => {
  const request = await getRequest();
  request.input("TeacherId", sql.UniqueIdentifier, teacherId);

  const result = await request.query(`
    SELECT 
      c.id AS courseId,
      c.slug,
      c.title,
      c.short_description AS shortDescription,
      c.description,
      c.price,
      c.currency,
      c.creator_id AS creatorId,
      c.published,
      c.published_at AS publishedAt,
      c.created_at AS createdAt
    FROM courses c
    JOIN course_teachers ct ON c.id = ct.course_id
    WHERE ct.teacher_id = @TeacherId
    ORDER BY c.created_at DESC;
  `);

  return result.recordset;
};

// Check 1 teacher có được gán vào course không
export const isTeacherOfCourseService = async (courseId, teacherId) => {
  const request = await getRequest();
  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("TeacherId", sql.UniqueIdentifier, teacherId);

  const result = await request.query(`
    SELECT TOP 1 1 AS isTeacher
    FROM course_teachers
    WHERE course_id = @CourseId AND teacher_id = @TeacherId;
  `);

  return result.recordset.length > 0;
};

//admin xem các bài giảng của teacher có trong khóa học
export const getLecturesByTeacherInCourseService = async (courseId, teacherId) => {
  const request = await getRequest();

  request.input("CourseId", sql.UniqueIdentifier, courseId);
  request.input("TeacherId", sql.UniqueIdentifier, teacherId);

  // Chỉ lấy lectures của course mà teacher này đang được gán
  const result = await request.query(`
    SELECT 
      l.id AS lectureId,
      l.title,
      l.content_type AS contentType,
      l.s3_key AS s3Key,
      l.duration_seconds AS durationSeconds,
      l.order_index AS orderIndex,
      l.published,
      l.created_at AS createdAt,
      l.updated_at AS updatedAt
    FROM lectures l
    JOIN courses c ON c.id = l.course_id
    JOIN course_teachers ct ON ct.course_id = c.id
    WHERE l.course_id = @CourseId
      AND ct.teacher_id = @TeacherId
    ORDER BY l.order_index ASC, l.created_at ASC;
  `);

  return result.recordset;
};
