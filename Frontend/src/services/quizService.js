import apiClient from "./https";

/**
 * Tạo practice mới (flashcard quiz)
 * API: POST /api/practices
 * @param {Object} payload - Dữ liệu practice
 * @param {string} payload.title - Tiêu đề practice
 * @param {string} payload.description - Mô tả practice
 * @param {string} payload.category - Danh mục (ví dụ: "vocabulary")
 * @param {string} payload.topic - Chủ đề (ví dụ: "animals")
 * @param {string} payload.language - Ngôn ngữ (ví dụ: "en")
 * @param {boolean} payload.published - Trạng thái công khai
 * @param {Array} payload.cards - Mảng các thẻ flashcard
 * @returns {Promise<Object>} Practice vừa tạo
 */
export async function createPractice(payload) {
  try {
    const res = await apiClient.post("/api/practices", payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create practice");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách practices của giáo viên
 * API: GET /api/practices/my?category=vocabulary&topic=animals
 * @param {Object} params - Query parameters
 * @param {string} params.category - Danh mục (optional)
 * @param {string} params.topic - Chủ đề (optional)
 * @returns {Promise<Array>} Danh sách practices
 */
export async function getMyPractices(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.category) {
      queryParams.append("category", params.category);
    }
    if (params.topic) {
      queryParams.append("topic", params.topic);
    }

    const queryString = queryParams.toString();
    const url = `/api/practices/my${queryString ? `?${queryString}` : ""}`;

    const res = await apiClient.get(url);
    const result = res.data;

    if (!result.success || !result.data) {
      throw new Error(result.message || "Failed to fetch practices");
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    throw error;
  }
}

