import { sql, pool, poolConnect } from '../config/db.js';

export async function findUserByEmail(email) {
  await poolConnect;
  const request = pool.request();
  request.input('email', sql.NVarChar(255), email);

  const result = await request.query(`
    SELECT TOP 1 id, email, password_hash, role_id, is_active
    FROM users
    WHERE email = @email
  `);

  return result.recordset[0] || null;
}

export async function createUserWithProfile({ email, passwordHash, phone, fullName }) {
  await poolConnect;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Insert user
    const userReq = new sql.Request(transaction);
    userReq.input('email', sql.NVarChar(255), email);
    userReq.input('password_hash', sql.NVarChar(sql.MAX), passwordHash);
    userReq.input('phone', sql.NVarChar(50), phone || null);
    // default role: 2 = Member (the roles seed you showed)
    userReq.input('role_id', sql.SmallInt, 2);

    const userResult = await userReq.query(`
      INSERT INTO users (email, password_hash, phone, role_id)
      OUTPUT inserted.id, inserted.email, inserted.role_id, inserted.is_active
      VALUES (@email, @password_hash, @phone, @role_id);
    `);

    const newUser = userResult.recordset[0];

    // Insert profile
    const profileReq = new sql.Request(transaction);
    profileReq.input('user_id', sql.UniqueIdentifier, newUser.id);
    profileReq.input('full_name', sql.NVarChar(255), fullName || null);

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

export async function findUserByIdWithProfile(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);

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
