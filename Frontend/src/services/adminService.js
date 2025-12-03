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