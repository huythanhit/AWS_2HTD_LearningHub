// src/services/adminService.js
import apiClient from "./https";

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
        throw err;
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
        throw err;
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
        throw err;
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

        return result.data; // backend trả message hoặc thông tin user vừa xóa
    } catch (err) {
        throw err;
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
        throw err;
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
// GET ALL COURSES (có phân trang)
export async function getCourses(page = 1, pageSize = 20) {
    try {
        const res = await apiClient.get(`/api/courses?page=${page}&pageSize=${pageSize}`);
        return res.data;   // backend trả thẳng list courses
    } catch (err) {
        console.error("GET COURSES ERROR:", err);
        throw err;
    }
}
// CREATE COURSE (Admin)
export async function createCourse(data) {
    try {
        const res = await apiClient.post("/api/admin/courses", data); // fix dùng apiClient
        return res.data.course;   // backend trả đúng object course
    } catch (err) {
        console.error("CREATE COURSE ERROR RAW:", err);
        throw err;
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

        return result; // backend trả { message, courseId }
    } catch (err) {
        console.error("DELETE COURSE ERROR RAW:", err);
        throw err;
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

        return result.assignment; // backend trả object assignment {courseId, teacherId}
    } catch (err) {
        console.error("ASSIGN TEACHER ERROR:", err);
        throw err;
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

        return result; // backend trả { message, courseId, teacherId }
    } catch (err) {
        console.error("REMOVE TEACHER ERROR:", err);
        throw err;
    }
}
// [MỚI] GET COURSE DETAILS (Bao gồm chapters/lessons)
export async function getCourseById(courseId) {
    try {
        // Giả sử API endpoint lấy chi tiết là /api/courses/{id}
        // Endpoint này thường trả về { ...courseInfo, modules: [...] hoặc lessons: [...] }
        const res = await apiClient.get(`/api/courses/${courseId}`);
        const result = res.data;
        
        // Trả về data (tùy format backend của bạn, nếu bọc trong success thì return result.data)
        return result.data || result; 
    } catch (err) {
        console.error("GET COURSE DETAIL ERROR:", err);
        throw err;
    }
}
// [MỚI] GET TEACHERS ASSIGNED TO A COURSE
export async function getCourseTeachers(courseId) {
    try {
        // Thử gọi endpoint chi tiết course (nhiều backend expose /api/admin/courses/:id)
        const res = await apiClient.get(`/api/admin/courses/${courseId}`);
        const result = res.data;

        // Nếu backend bọc trong `data`
        const courseData = result.data || result;

        // Nếu có trường teachers trả về -> trả về
        if (courseData && Array.isArray(courseData.teachers)) {
            return courseData.teachers;
        }

        // Nếu không tìm thấy teachers ở đây -> trả rỗng để FE không lỗi
        return [];
    } catch (err) {
        // Nếu 404 hoặc endpoint khác, log rõ và trả rỗng (để FE không dừng)
        console.error("GET COURSE TEACHERS ERROR:", err);
        return [];
    }
}
