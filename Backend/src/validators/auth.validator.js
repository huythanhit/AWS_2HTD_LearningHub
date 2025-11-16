// src/validators/auth.validator.js
// Validate body cho register / login

import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required(),
  fullName: Joi.string().max(255).required(), 
  phone: Joi.string().max(50).required()      
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required()
});
