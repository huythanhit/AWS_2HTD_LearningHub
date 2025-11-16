// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  findUserByEmail,
  createUserWithProfile,
  findUserByIdWithProfile
} from '../models/user.model.js';

dotenv.config();

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role_id: user.role_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// NOTE: ES MODULE EXPORTS (no module.exports!!)
export async function register({ email, password, fullName, phone }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await createUserWithProfile({
    email,
    passwordHash,
    phone,
    fullName
  });

  const token = signToken(newUser);

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      role_id: newUser.role_id,
      is_active: newUser.is_active
    },
    token
  };
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error('Account is inactive');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      is_active: user.is_active
    },
    token
  };
}

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
