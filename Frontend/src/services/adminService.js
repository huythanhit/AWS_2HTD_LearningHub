
import apiClient from "./https";

// Normalize axios/network errors so callers can inspect `err.data` reliably.
function normalizeAndThrow(err) {
    try {
        if (!err) throw err;

        if (err.response && err.response.data) {

            err.data = err.response.data;

            if (err.response.data.message) err.message = err.response.data.message;
        }
    } catch (e) {
        // ignore normalization errors
    }
    throw err;
}

export async function getAdminUsers(page = 1, limit = 10) {
    try {
        const res = await apiClient.get(`/api/admin/users?page=${page}&limit=${limit}`);
        const result = res.data;

        if (!result.success) {
            throw new Error(result.message || "Failed to get users");
        }

        return {
            users: result.data.users,        // đúng format backend
            pagination: result.data.pagination
        };

    } catch (err) {
        normalizeAndThrow(err);
    }
}
// CREATE USER (Admin)
export async function createUser(payload) {
    try {
        const res = await apiClient.post("/api/admin/users", payload);
        const result = res.data;

        if (!result.success) {
            throw new Error(result.message || "Create user failed");
        }

        return result.data; // backend trả user vừa tạo
    } catch (err) {
        normalizeAndThrow(err);
    }
}
// UPDATE USER
export async function updateUser(userId, payload) {
    try {
        const res = await apiClient.patch(`/api/admin/users/${userId}`, payload);
        const result = res.data;

        if (!result.success) {
            throw new Error(result.message || "Update user failed");
        }

        return result.data;
    } catch (err) {
        normalizeAndThrow(err);
    }
}
// DELETE USER
export async function deleteUser(userId) {
    try {
        const res = await apiClient.delete(`/api/admin/users/${userId}`);
        const result = res.data;

        if (!result.success) {
            throw new Error(result.message || "Delete user failed");
        }

        return result.data;
    } catch (err) {
        normalizeAndThrow(err);
    }
}
// RESTORE USER
export async function restoreUser(userId) {
    try {
        const res = await apiClient.patch(`/api/admin/users/${userId}/restore`);
        const result = res.data;

        if (!result.success) {
            throw new Error(result.message || "Restore user failed");
        }

        return result.data; // backend trả user đã restore
    } catch (err) {
        normalizeAndThrow(err);
    }
}
// GET LIST DELETED USERS
export async function getDeletedUsers() {
    const res = await apiClient.get("/api/admin/users/deleted");
    const result = res.data;

    if (!result.success) {
        throw new Error(result.message || "Get deleted users failed");
    }

    return {
        users: result.data.users
    };
}

// --- [MỚI] LẤY FULL LIST KHÓA HỌC CHO ADMIN (Bao gồm Draft) ---
export async function getAdminCourses() {
    try {

        // Dùng apiClient để tự động gửi kèm Token Authorization
        const res = await apiClient.get("/api/admin/courses");

        const data = res.data;

        // Xử lý các trường hợp format dữ liệu trả về khác nhau của backend
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.courses)) return data.courses;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.result)) return data.result;

        return [];
    } catch (err) {
        console.warn("API admin/courses lỗi, thử fallback sang public API...");
        // Fallback: nếu API admin lỗi, gọi API thường (có thể thiếu Draft)
        try {
            const resFallback = await apiClient.get("/api/courses?page=1&pageSize=100");
            const data = resFallback.data;
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.courses)) return data.courses;
            return [];
        } catch (e2) {
            console.error("GET ADMIN COURSES ERROR:", err);
            normalizeAndThrow(err);
        }
    }
}

// GET ALL COURSES (Public - thường chỉ trả về Published)
export async function getCourses(page = 1, pageSize = 20) {
    try {
        const res = await apiClient.get(`/api/courses?page=${page}&pageSize=${pageSize}`);
        return res.data;
    } catch (err) {
        console.error("GET COURSES ERROR:", err);
        normalizeAndThrow(err);
    }
}
// CREATE COURSE
export async function createCourse(data) {
    try {
        const res = await apiClient.post("/api/admin/courses", data);
        const result = res.data;


        if (!result.course) {

            throw new Error(result.message || "Create course failed");
        }

        return result.course;
    } catch (err) {
        console.error("CREATE COURSE ERROR:", err);
        normalizeAndThrow(err);
    }
}
// DELETE COURSE (Admin)
export async function deleteCourse(courseId) {
    try {
        const res = await apiClient.delete(`/api/admin/courses/${courseId}`);
        const result = res.data;

        if (!result.courseId) {
            throw new Error(result.message || "Delete course failed");
        }

        return result;
    } catch (err) {
        console.error("DELETE COURSE ERROR RAW:", err);
        normalizeAndThrow(err);
    }
}
// ASSIGN TEACHER TO COURSE
export async function assignTeacherToCourse(courseId, teacherId) {
    try {
        const res = await apiClient.post(`/api/admin/courses/${courseId}/teachers`, { teacherId });
        const result = res.data;

        if (!result.assignment) {
            throw new Error(result.message || "Assign teacher failed");
        }

        return result.assignment;
    } catch (err) {
        console.error("ASSIGN TEACHER ERROR:", err);
        normalizeAndThrow(err);
    }
}
// REMOVE TEACHER FROM COURSE
export async function removeTeacherFromCourse(courseId, teacherId) {
    try {
        const res = await apiClient.delete(`/api/admin/courses/${courseId}/teachers/${teacherId}`);
        const result = res.data;

        if (!result.courseId || !result.teacherId) {
            throw new Error(result.message || "Remove teacher failed");
        }

        return result;
    } catch (err) {
        console.error("REMOVE TEACHER ERROR:", err);
        normalizeAndThrow(err);
    }
}
// [MỚI] GET COURSE DETAILS (Bao gồm chapters/lessons)
export async function getCourseById(courseId) {
    try {
        const res = await apiClient.get(`/api/courses/${courseId}`);
        const result = res.data;
        return result.data || result;
    } catch (err) {
        console.error("GET COURSE DETAIL ERROR:", err);
        normalizeAndThrow(err);
    }
}
// [MỚI] GET TEACHERS ASSIGNED TO A COURSE
export async function getCourseTeachers(courseId) {
    try {
        const res = await apiClient.get(`/api/admin/courses/${courseId}`);
        const result = res.data;
        const courseData = result.data || result;

        if (courseData && Array.isArray(courseData.teachers)) {
            return courseData.teachers;
        }
        return [];
    } catch (err) {
        console.error("GET COURSE TEACHERS ERROR:", err);
        return [];
    }
}
// edit COURSE (Admin)
export async function updateCourse(courseId, data) {
    try {
        const res = await apiClient.patch(`/api/admin/courses/${courseId}`, data);
        const result = res.data;

        // Dựa trên response mẫu bạn gửi: { message: "Course updated", course: {...} }
        if (!result.course) {
            throw new Error(result.message || "Update course failed");
        }

        return result.course; // Trả về object course đã được update
    } catch (err) {
        console.error("UPDATE COURSE ERROR:", err);
        normalizeAndThrow(err);
    }
}
// [CẬP NHẬT] LẤY DANH SÁCH BÀI GIẢNG (Chi tiết theo teacher & course)
export async function getTeacherCourseLectures(teacherId, courseId) {
    try {

        const res = await apiClient.get(`/api/admin/teachers/${teacherId}/courses/${courseId}/lectures`);
        return res.data;
    } catch (err) {
        console.error("GET TEACHER COURSE LECTURES ERROR:", err);
        normalizeAndThrow(err);
    }
}
// [MỚI] UPDATE LECTURE
export async function updateCourseLecture(courseId, lectureId, payload) {
    try {
        const res = await apiClient.patch(`/api/admin/courses/${courseId}/lectures/${lectureId}`, payload);

        return res.data;
    } catch (err) {
        console.error("UPDATE LECTURE ERROR:", err);
        normalizeAndThrow(err);
    }
}
// [MỚI] DELETE LECTURE
export async function deleteCourseLecture(courseId, lectureId) {
    try {
        const res = await apiClient.delete(`/api/admin/courses/${courseId}/lectures/${lectureId}`);
        return res.data;
    } catch (err) {
        console.error("DELETE LECTURE ERROR:", err);
        normalizeAndThrow(err);
    }
}