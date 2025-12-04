import apiClient from "./https";

/**
 * Lấy danh sách đề thi/bài kiểm tra
 * @returns {Promise<Object>} Danh sách đề thi với pagination
 */
export async function getExams() {
  try {
    const res = await apiClient.get("/api/tests/exams");
    const result = res.data;

    if (!result.success || !result.data) {
      throw new Error(result.message || "Failed to fetch exams");
    }

    return result.data;
  } catch (error) {
    // Bắt buộc re-throw để component phía trên xử lý tiếp
    throw error;
  }
}

/**
 * Tạo câu hỏi cho đề thi
 * API: POST /api/tests/questions
 * @param {Object} payload
 * @returns {Promise<Object>} Dữ liệu câu hỏi vừa tạo
 */
export async function createQuestion(payload) {
  try {
    const res = await apiClient.post("/api/tests/questions", payload);
    const result = res.data;

    // Tuỳ theo cấu trúc response của backend có thể điều chỉnh lại phần này
    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create question");
    }

    return result.data ?? result;
  } catch (error) {
    // Yêu cầu: catch chỉ dùng để throw error ra ngoài
    throw error;
  }
}

/**
 * Lấy danh sách khóa học của giảng viên
 * API: GET /api/teacher/courses
 * Backend đang trả về mảng các khóa học (không bọc trong success/data)
 * @returns {Promise<Array>} Danh sách khóa học
 */
export async function getTeacherCourses() {
  try {
    const res = await apiClient.get("/api/teacher/courses");
    // Theo Postman: response là một mảng các course
    return res.data;
  } catch (error) {
    // Re-throw để component xử lý hiển thị lỗi
    throw error;
  }
}

/**
 * Lấy danh sách bài giảng (lectures) của một khóa học
 * API: GET /api/admin/courses/:courseId/lectures
 * @param {string} courseId
 * @returns {Promise<Array>} Danh sách bài giảng
 */
export async function getCourseLectures(courseId) {
  if (!courseId) {
    throw new Error("courseId is required");
  }

  try {
    const res = await apiClient.get(`/api/admin/courses/${courseId}/lectures`);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo bài giảng mới cho một khóa học
 * API: POST /api/admin/courses/:courseId/lectures
 * @param {string} courseId
 * @param {Object} payload
 * @returns {Promise<Object>} Bài giảng vừa tạo
 */
export async function createCourseLecture(courseId, payload) {
  if (!courseId) {
    throw new Error("courseId is required");
  }

  try {
    const res = await apiClient.post(
      `/api/admin/courses/${courseId}/lectures`,
      payload
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật bài giảng
 * API: PUT /api/admin/courses/:courseId/lectures/:lectureId
 * @param {string} courseId
 * @param {string} lectureId
 * @param {Object} payload
 * @returns {Promise<Object>} Bài giảng đã cập nhật
 */
export async function updateCourseLecture(courseId, lectureId, payload) {
  if (!courseId || !lectureId) {
    throw new Error("courseId and lectureId are required");
  }

  try {
    const res = await apiClient.patch(
      `/api/admin/courses/${courseId}/lectures/${lectureId}`,
      payload
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa bài giảng
 * API: DELETE /api/admin/courses/:courseId/lectures/:lectureId
 * @param {string} courseId
 * @param {string} lectureId
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deleteCourseLecture(courseId, lectureId) {
  if (!courseId || !lectureId) {
    throw new Error("courseId and lectureId are required");
  }

  try {
    const res = await apiClient.delete(
      `/api/admin/courses/${courseId}/lectures/${lectureId}`
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}
