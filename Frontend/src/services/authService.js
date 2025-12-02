import apiClient from "./https";

export async function login({ email, password }) {
    try {
        const res = await apiClient.post("/api/auth/login", { email, password });
        const result = res.data;

        if (!result.success || !result.data) {
            throw new Error(result.message || "Login failed");
        }

        const { user, cognitoTokens } = result.data;

        // Trả về chuỗi đúng cho frontend
        return {
            token: cognitoTokens.accessToken, // Sử dụng accessToken để lưu
            user: {
                id: user.id,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name,
                is_active: user.is_active,
                email_verified: user.email_verified
            },
        };
    } catch (err) {
        throw err;
    }
}

// Register
export async function register({ fullName, email, phone, password }) {
    try {
        const res = await apiClient.post("/api/auth/register", {
            fullName,
            email,
            phone, // Đảm bảo có tham số phone
            password
        });
        const result = res.data;

        // Kiểm tra phản hồi thành công
        if (!result.success) {
            throw new Error(result.message || "Registration failed");
        }

        return result; // Trả về kết quả thành công
    } catch (error) {
        throw error; // Ném lỗi về phía trên để xử lý
    }
}