// src/middlewares/auth.middleware.js
// Xác thực request bằng JWT của Cognito và map Cognito Groups -> roles

import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import { findUserByEmail } from "../models/user.model.js";

dotenv.config();

const region = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

// URL để lấy jwks.json của pool
const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

// Cache JWKS trong memory
let jwksCache = null;

// Map group -> role_id trong DB
const COGNITO_GROUP_TO_ROLE_ID = {
  Guest: 1,
  Member: 2,
  Teacher: 3,
  Admin: 4,
};

// Helper: tải JWKS nếu cache chưa có
async function getJwks() {
  if (jwksCache) return jwksCache;

  const res = await fetch(jwksUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  jwksCache = data.keys;
  return jwksCache;
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];

    // 1. Decode header để lấy kid
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header) {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    }

    const kid = decodedHeader.header.kid;

    // 2. Lấy JWK tương ứng kid
    const keys = await getJwks();
    const jwk = keys.find((k) => k.kid === kid);

    if (!jwk) {
      const err = new Error("Public key not found for token");
      err.statusCode = 401;
      throw err;
    }

    const pem = jwkToPem(jwk);

    // 3. Verify token với public key
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const payload = jwt.verify(token, pem, {
      algorithms: ["RS256"],
      issuer,
    });

    // Kiểm tra audience / client_id
    if (payload.aud && payload.aud !== clientId) {
      const err = new Error("Invalid token audience");
      err.statusCode = 401;
      throw err;
    }

    if (payload.client_id && payload.client_id !== clientId) {
      const err = new Error("Invalid token client_id");
      err.statusCode = 401;
      throw err;
    }

    // 4. Map Cognito groups -> roleName / roleId
    const groups = payload["cognito:groups"] || [];
    let roleName = "Guest";
    if (groups.includes("Admin")) roleName = "Admin";
    else if (groups.includes("Teacher")) roleName = "Teacher";
    else if (groups.includes("Member")) roleName = "Member";

    const roleId = COGNITO_GROUP_TO_ROLE_ID[roleName] || 1;

    // 5. Tìm user local trong DB bằng email
    const email =
      payload.email || payload.username || payload["cognito:username"];
    let localUserId = null;
    let localUser = null;

    if (email) {
      localUser = await findUserByEmail(email);
      if (localUser) {
        localUserId = localUser.id;

        // Fallback: Nếu không có Cognito groups, dùng role từ DB
        if (groups.length === 0 && localUser.role_id) {
          const ROLE_ID_TO_NAME = {
            1: "Guest",
            2: "Member",
            3: "Teacher",
            4: "Admin",
          };
          roleName = ROLE_ID_TO_NAME[localUser.role_id] || "Guest";
        }
      }
    }

    // 6. Gắn thông tin user vào req để controller dùng
    req.user = {
      sub: payload.sub,
      email,
      groups,
      roleName,
      roleId,
      localUserId,
      tokenPayload: payload,
    };

    return next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    err.statusCode = err.statusCode || 401;
    return next(err);
  }
}
