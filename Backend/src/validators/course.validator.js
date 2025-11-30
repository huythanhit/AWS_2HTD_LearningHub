// src/validators/course.validator.js
// Validation schemas cho course

import Joi from "joi";

export const createCourseSchema = Joi.object({
  slug: Joi.string()
    .min(3)
    .max(255)
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),

  title: Joi.string().min(5).max(255).required().messages({
    "string.min": "Tiêu đề phải có ít nhất 5 ký tự",
    "string.max": "Tiêu đề không được quá 255 ký tự",
  }),

  short_description: Joi.string().min(10).max(500).required().messages({
    "string.min": "Mô tả ngắn phải có ít nhất 10 ký tự",
    "string.max": "Mô tả ngắn không được quá 500 ký tự",
  }),

  description: Joi.string().min(20).required().messages({
    "string.min": "Mô tả chi tiết phải có ít nhất 20 ký tự",
  }),

  price: Joi.number().min(0).max(999999.99).precision(2).required().messages({
    "number.min": "Giá không được âm",
    "number.max": "Giá không được quá 999,999.99",
  }),

  currency: Joi.string()
    .length(3)
    .uppercase()
    .default("USD")
    .valid("USD", "VND", "EUR", "JPY")
    .messages({
      "any.only": "Loại tiền tệ phải là USD, VND, EUR hoặc JPY",
    }),

  published: Joi.boolean().default(false),
});

export const updateCourseSchema = Joi.object({
  slug: Joi.string()
    .min(3)
    .max(255)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      "string.pattern.base":
        "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    }),

  title: Joi.string().min(5).max(255).messages({
    "string.min": "Tiêu đề phải có ít nhất 5 ký tự",
    "string.max": "Tiêu đề không được quá 255 ký tự",
  }),

  short_description: Joi.string().min(10).max(500).messages({
    "string.min": "Mô tả ngắn phải có ít nhất 10 ký tự",
    "string.max": "Mô tả ngắn không được quá 500 ký tự",
  }),

  description: Joi.string().min(20).messages({
    "string.min": "Mô tả chi tiết phải có ít nhất 20 ký tự",
  }),

  price: Joi.number().min(0).max(999999.99).precision(2).messages({
    "number.min": "Giá không được âm",
    "number.max": "Giá không được quá 999,999.99",
  }),

  currency: Joi.string()
    .length(3)
    .uppercase()
    .valid("USD", "VND", "EUR", "JPY")
    .messages({
      "any.only": "Loại tiền tệ phải là USD, VND, EUR hoặc JPY",
    }),

  published: Joi.boolean(),
}).min(1);

export const courseQuerySchema = Joi.object({
  search: Joi.string().max(255).allow(""),
  published: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(5).max(100).default(20),
});
