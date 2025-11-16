// src/services/auth.service.js
// Business logic cho auth, dùng AWS Cognito + SQL Server

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  findUserByEmail,
  createUserWithProfile,
  findUserByIdWithProfile
} from '../models/user.model.js';

import {
  cognitoClient,
  COGNITO_CLIENT_ID
} from '../config/cognito.js';

import {
  SignUpCommand,
  InitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';

dotenv.config();


export async function register({ email, password, fullName, phone }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  let userSub;
  try {
    // username không được ở dạng email (pool của bạn dùng email alias)
    const username = email.split('@')[0] + '_' + Date.now();

    // 🆕 Chuẩn bị UserAttributes theo schema Cognito
    const userAttributes = [
      { Name: 'email', Value: email },
      // phone_number là tên attribute chuẩn của Cognito
      { Name: 'phone_number', Value: phone },
      // family_name bắt buộc -> dùng luôn fullName nếu bạn chưa tách họ riêng
      { Name: 'family_name', Value: fullName }
    ];

    const signUpCommand = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: userAttributes
    });

    const response = await cognitoClient.send(signUpCommand);
    userSub = response.UserSub;
  } catch (err) {
    console.error('Cognito SignUp error:', err);

    const e = new Error(
      `${err.name || 'CognitoError'}: ${err.message || 'Cognito SignUp failed'}`
    );
    e.statusCode = 500;
    e.errors = err;
    throw e;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await createUserWithProfile({
    email,
    passwordHash,
    phone,
    fullName,
    cognitoSub: userSub
  });

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      role_id: newUser.role_id,
      is_active: newUser.is_active
    },
    cognito: {
      userSub,
      userConfirmed: false
    }
  };
}



// Đăng nhập: xác thực Cognito, trả về token Cognito + user DB
export async function login({ email, password }) {
  let authResult;
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);
    authResult = response.AuthenticationResult;
  } catch (err) {
    console.error('Cognito login error:', err);

    if (err.name === 'NotAuthorizedException') {
      const e = new Error('Invalid email or password');
      e.statusCode = 401;
      throw e;
    }

    if (err.name === 'UserNotConfirmedException') {
      const e = new Error('User not confirmed (please verify email)');
      e.statusCode = 403;
      throw e;
    }

    const e = new Error('Cannot login with Cognito');
    e.statusCode = 500;
    throw e;
  }

  // Tìm user trong DB để lấy role, profile
  let user = await findUserByEmail(email);

  if (!user) {
    const e = new Error('User not found in local database');
    e.statusCode = 404;
    throw e;
  }

  if (!user.is_active) {
    const e = new Error('Account is inactive');
    e.statusCode = 403;
    throw e;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active
    },
    cognitoTokens: {
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
      tokenType: authResult.TokenType
    }
  };
}

// Lấy info user từ DB (sau khi đã auth bằng Cognito JWT)
export async function getCurrentUser(userId) {
  const user = await findUserByIdWithProfile(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    is_active: user.is_active,
    full_name: user.full_name,
    avatar_s3_key: user.avatar_s3_key,
    bio: user.bio
  };
}
