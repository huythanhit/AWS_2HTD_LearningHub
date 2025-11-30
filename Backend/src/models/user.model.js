// src/models/user.model.js
// Các hàm thao tác với bảng users và user_profiles

import { sql, pool, poolConnect } from "../config/db.js";

// Tìm user theo email
export async function findUserByEmail(email) {
  await poolConnect;
  const request = pool.request();
  request.input("email", sql.NVarChar(255), email);

  const result = await request.query(`
    SELECT TOP 1 id, email, password_hash, role_id, is_active, cognito_sub
    FROM users
    WHERE email = @email
  `);

  return result.recordset[0] || null;
}

// Tạo user + profile, gắn với cognito_sub
export async function createUserWithProfile({
  email,
  passwordHash,
  phone,
  fullName,
  cognitoSub,
}) {
  await poolConnect;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const userReq = new sql.Request(transaction);
    userReq.input("email", sql.NVarChar(255), email);
    userReq.input("password_hash", sql.NVarChar(sql.MAX), passwordHash || null);
    userReq.input("phone", sql.NVarChar(50), phone || null);
    userReq.input("role_id", sql.SmallInt, 2); // 2 = Member
    userReq.input("cognito_sub", sql.NVarChar(255), cognitoSub || null);

    const userResult = await userReq.query(`
      INSERT INTO users (email, password_hash, phone, role_id, cognito_sub)
      OUTPUT inserted.id, inserted.email, inserted.role_id, inserted.is_active
      VALUES (
        @email,
        @password_hash,
        @phone,
        @role_id,
        CASE 
          WHEN @cognito_sub IS NULL THEN CAST(NEWID() AS NVARCHAR(255))
          ELSE @cognito_sub
        END
      );
    `);

    const newUser = userResult.recordset[0];

    const profileReq = new sql.Request(transaction);
    profileReq.input("user_id", sql.UniqueIdentifier, newUser.id);
    profileReq.input("full_name", sql.NVarChar(255), fullName || null);

    await profileReq.query(`
      INSERT INTO user_profiles (user_id, full_name)
      VALUES (@user_id, @full_name);
    `);

    await transaction.commit();
    return newUser;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Lấy user + profile theo id
export async function findUserByIdWithProfile(userId) {
  await poolConnect;
  const request = pool.request();
  request.input("id", sql.UniqueIdentifier, userId);

  const result = await request.query(`
    SELECT 
      u.id,
      u.email,
      u.role_id,
      u.is_active,
      up.full_name,
      up.avatar_s3_key,
      up.bio
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = @id
  `);

  return result.recordset[0] || null;
}

// Cập nhật trạng thái email_verified của user
// Dùng để đồng bộ cờ email_verified trong DB với trạng thái verify trên Cognito
export async function updateEmailVerified(userId, isVerified) {
  await poolConnect;
  const request = pool.request();
  request.input("id", sql.UniqueIdentifier, userId);
  request.input("email_verified", sql.Bit, isVerified ? 1 : 0);

  const result = await request.query(`
    UPDATE users
    SET 
      email_verified = @email_verified,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT 
      inserted.id,
      inserted.email,
      inserted.role_id,
      inserted.is_active,
      inserted.email_verified
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// Cập nhật password_hash cho user (sau khi reset mật khẩu)
export async function updateUserPasswordHash(userId, passwordHash) {
  await poolConnect;
  const request = pool.request();
  request.input("id", sql.UniqueIdentifier, userId);
  request.input("password_hash", sql.NVarChar(sql.MAX), passwordHash);

  const result = await request.query(`
    UPDATE users
    SET 
      password_hash = @password_hash,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT 
      inserted.id,
      inserted.email,
      inserted.role_id,
      inserted.is_active,
      inserted.email_verified
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}
