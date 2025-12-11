// src/services/auth.service.js
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import {
  findUserByEmail,
  createUserWithProfile,
  findUserByIdWithProfile,
  updateEmailVerified,
  updateUserPasswordHash,
} from "../models/user.model.js";
import { sql, pool, poolConnect } from "../config/db.js";

import { cognitoClient, COGNITO_CLIENT_ID } from "../config/cognito.js";

import {
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

dotenv.config();

// Role mapping constants
const ROLE_MAPPING = {
  1: "Guest",
  2: "Member",
  3: "Teacher",
  4: "Admin",
};

// NEW: map từ string role FE gửi -> role_id trong DB
const ROLE_KEY_TO_ID = {
  member: 2,
  teacher: 3,
};

// Admin email - tự động gán role Admin khi đăng ký
const ADMIN_EMAIL = "phamminhtuan171204@gmail.com";
const ADMIN_ROLE_ID = 4;

// Đăng ký
export async function register({ email, password, fullName, phone, role }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  let userSub;
  try {
    const userAttributes = [
      { Name: "email", Value: email },
      ...(phone ? [{ Name: "phone_number", Value: phone }] : []),
      ...(fullName ? [{ Name: "family_name", Value: fullName }] : []),
    ];

    const signUpCommand = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    });

    const response = await cognitoClient.send(signUpCommand);
    userSub = response.UserSub;
  } catch (err) {
    console.error("Cognito SignUp error:", err);

    const e = new Error(
      `${err.name || "CognitoError"}: ${err.message || "Cognito SignUp failed"}`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }

  // 👉 Xử lý role: Check email đặc biệt để gán Admin
  let desiredRoleId;
  
  // Nếu email là admin email → cố định role Admin
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    desiredRoleId = ADMIN_ROLE_ID;
    console.log(`[Register] Admin email detected: ${email}. Assigning Admin role.`);
  } else {
    // Xử lý role FE gửi lên (member hoặc teacher)
  const normalizedRoleKey = (role || "").toLowerCase(); // "member" | "teacher"
    desiredRoleId = ROLE_KEY_TO_ID[normalizedRoleKey] ?? 2; // default Member nếu gửi bậy
  }

  // Tạo user trong database
  let newUser;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    newUser = await createUserWithProfile({
      email,
      passwordHash,
      phone,
      fullName,
      cognitoSub: userSub,
      roleId: desiredRoleId, // 👈 Truyền roleId xuống model (có thể là Admin nếu email đặc biệt)
    });
  } catch (dbErr) {
    console.error("Database create user error:", dbErr);
    
    // Nếu lỗi database nhưng Cognito đã tạo user, cần rollback Cognito user
    // Hoặc ít nhất log để admin biết có orphaned Cognito user
    console.error(
      `WARNING: Cognito user created (${userSub}) but database insert failed. ` +
      `Email: ${email}. This user may need manual cleanup.`
    );
    
    const e = new Error(
      `Database error: ${dbErr.message || "Failed to create user in database"}`
    );
    e.statusCode = 500;
    e.errors = dbErr;
    e.cognitoUserSub = userSub; // Include để có thể cleanup sau
    throw e;
  }

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      role_id: newUser.role_id,
      role_name: ROLE_MAPPING[newUser.role_id] || "Guest",
      is_active: newUser.is_active,
    },
    cognito: {
      userSub,
      userConfirmed: false,
    },
  };
}

// Đăng nhập
export async function login({ email, password }) {
  let authResult;
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    authResult = response.AuthenticationResult;
  } catch (err) {
    console.error("Cognito login error:", err);

    if (err.name === "NotAuthorizedException") {
      const e = new Error("Invalid email or password");
      e.statusCode = 401;
      throw e;
    }

    if (err.name === "UserNotConfirmedException") {
      const e = new Error("User not confirmed (please verify email)");
      e.statusCode = 403;
      e.code = "EMAIL_NOT_VERIFIED";
      throw e;
    }

    if (err.name === "InvalidParameterException") {
      const e = new Error(
        `${err.name}: ${
          err.message || "USER_PASSWORD_AUTH flow not enabled for this client"
        }`
      );
      e.statusCode = 500;
      e.errors = err;
      throw e;
    }

    const e = new Error(
      `${err.name || "CognitoError"}: ${
        err.message || "Cannot login with Cognito"
      }`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }

  if (!authResult || !authResult.IdToken) {
    const e = new Error("Không nhận được token từ Cognito");
    e.statusCode = 500;
    throw e;
  }

  // Decode IdToken để lấy thông tin user
  let emailVerified = false;
  let cognitoSub = null;
  let cognitoEmail = null;
  let cognitoPhone = null;
  let cognitoFullName = null;
  
  try {
    const [, payload] = authResult.IdToken.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    emailVerified = !!decoded.email_verified;
    cognitoSub = decoded.sub || null;
    cognitoEmail = decoded.email || email;
    cognitoPhone = decoded.phone_number || null;
    cognitoFullName = decoded.family_name || decoded.name || null;
  } catch (err) {
    console.error("Decode IdToken error:", err);
  }

  // Lấy user trong DB
  let user = await findUserByEmail(email);

  // Nếu không tìm thấy user trong DB nhưng đã đăng nhập thành công với Cognito
  // → Tự động tạo user trong local DB (auto-sync)
  if (!user) {
    console.log(`[Auto-sync] User ${email} exists in Cognito but not in local DB. Creating user...`);
    
    try {
      // Check email đặc biệt để gán Admin role
      const userEmail = cognitoEmail || email;
      const autoRoleId = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() 
        ? ADMIN_ROLE_ID 
        : 2; // Default: Member role
      
      if (autoRoleId === ADMIN_ROLE_ID) {
        console.log(`[Auto-sync] Admin email detected: ${userEmail}. Assigning Admin role.`);
      }
      
      // Tạo user mới với thông tin từ Cognito
      // Không có password hash vì password được quản lý bởi Cognito
      const newUser = await createUserWithProfile({
        email: userEmail,
        passwordHash: null, // Password được quản lý bởi Cognito
        phone: cognitoPhone || null,
        fullName: cognitoFullName || null,
        cognitoSub: cognitoSub,
        roleId: autoRoleId, // Admin nếu email đặc biệt, Member mặc định
      });
      
      user = await findUserByEmail(email);
      console.log(`[Auto-sync] Successfully created user in local DB: ${email}`);
    } catch (syncErr) {
      console.error("[Auto-sync] Failed to create user in local DB:", syncErr);
      const e = new Error(
        "User authenticated with Cognito but failed to sync with local database. Please contact support."
      );
      e.statusCode = 500;
      e.originalError = syncErr.message;
    throw e;
    }
  } else {
    // User đã tồn tại: Kiểm tra và sync cognito_sub nếu chưa có
    if (cognitoSub && !user.cognito_sub) {
      console.log(`[Auto-sync] Updating cognito_sub for existing user: ${email}`);
      try {
        await poolConnect;
        const request = pool.request();
        request.input('id', sql.UniqueIdentifier, user.id);
        request.input('cognito_sub', sql.NVarChar(255), cognitoSub);
        
        await request.query(`
          UPDATE users
          SET cognito_sub = @cognito_sub,
              updated_at = SYSDATETIMEOFFSET()
          WHERE id = @id;
        `);
        
        // Reload user để có cognito_sub mới
        user = await findUserByEmail(email);
        console.log(`[Auto-sync] Successfully updated cognito_sub for user: ${email}`);
      } catch (updateErr) {
        console.error("[Auto-sync] Failed to update cognito_sub:", updateErr);
        // Không throw error, chỉ log vì user vẫn có thể đăng nhập
      }
    }
  }

  if (!user.is_active) {
    const e = new Error("Account is inactive");
    e.statusCode = 403;
    throw e;
  }

  if (emailVerified && !user.email_verified) {
    try {
      user = await updateEmailVerified(user.id, true);
    } catch (err) {
      console.error("Update email_verified in DB error:", err);
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: ROLE_MAPPING[user.role_id] || "Guest",
      is_active: user.is_active,
      email_verified: user.email_verified,
    },
    cognitoTokens: {
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
      tokenType: authResult.TokenType,
    },
  };
}

// Xác thực email bằng mã code Cognito gửi về mail
export async function confirmEmail({ email, code }) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(command);
  } catch (err) {
    console.error("Cognito confirm email error:", err);

    if (err.name === "CodeMismatchException") {
      const e = new Error("Mã xác thực không đúng");
      e.statusCode = 400;
      throw e;
    }

    if (err.name === "ExpiredCodeException") {
      const e = new Error("Mã xác thực đã hết hạn");
      e.statusCode = 400;
      throw e;
    }

    const e = new Error(
      `${err.name || "CognitoError"}: ${err.message || "Cannot confirm email"}`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }

  // Sau khi confirm thành công, sync email_verified trong DB
  const user = await findUserByEmail(email);
  if (user && !user.email_verified) {
    await updateEmailVerified(user.id, true);
  }

  return true;
}

//Gửi lại mã xác thực email
export async function resendConfirmCode({ email }) {
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error("Cognito resend confirm code error:", err);

    const e = new Error(
      `${err.name || "CognitoError"}: ${
        err.message || "Cannot resend confirm code"
      }`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }
}

// Lấy info user từ DB (sau khi đã auth bằng Cognito JWT ở middleware)
export async function getCurrentUser(userId) {
  const user = await findUserByIdWithProfile(userId);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    role_name: ROLE_MAPPING[user.role_id] || "Guest",
    is_active: user.is_active,
    full_name: user.full_name,
    avatar_s3_key: user.avatar_s3_key,
    bio: user.bio,
  };
}

// Gửi mã quên mật khẩu (Cognito gửi code về email)
export async function forgotPassword({ email }) {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return true;
  } catch (err) {
    console.error("Cognito forgot password error:", err);

    if (err.name === "UserNotFoundException") {
      const e = new Error("User not found");
      e.statusCode = 404;
      throw e;
    }

    const e = new Error(
      `${err.name || "CognitoError"}: ${
        err.message || "Cannot send forgot password code"
      }`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }
}

// Xác nhận quên mật khẩu: nhập code + mật khẩu mới
export async function resetPassword({ email, code, newPassword }) {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(command);
  } catch (err) {
    console.error("Cognito reset password error:", err);

    if (err.name === "CodeMismatchException") {
      const e = new Error("Mã xác thực không đúng");
      e.statusCode = 400;
      throw e;
    }

    if (err.name === "ExpiredCodeException") {
      const e = new Error("Mã xác thực đã hết hạn");
      e.statusCode = 400;
      throw e;
    }

    const e = new Error(
      `${err.name || "CognitoError"}: ${err.message || "Cannot reset password"}`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }

  const user = await findUserByEmail(email);
  if (user) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordHash(user.id, passwordHash);
  }

  return true;
}

// Logout - Revoke refresh token trên Cognito
export async function logout({ accessToken }) {
  try {
    // Import GlobalSignOutCommand
    const { GlobalSignOutCommand } = await import(
      "@aws-sdk/client-cognito-identity-provider"
    );

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(command);
    return { success: true, message: "Logged out successfully" };
  } catch (err) {
    console.error("Cognito logout error:", err);

    // Nếu token đã expire hoặc invalid, vẫn coi như logout thành công
    if (
      err.name === "NotAuthorizedException" ||
      err.name === "TokenExpiredException"
    ) {
      return {
        success: true,
        message: "Logged out successfully (token already invalid)",
      };
    }

    const e = new Error(
      `${err.name || "CognitoError"}: ${
        err.message || "Cannot logout from Cognito"
      }`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }
}
