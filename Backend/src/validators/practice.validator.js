// src/validators/practice.validator.js
import Joi from 'joi';

function validate(schema) {
  return (req, res, next) => {
    const options = { abortEarly: false, stripUnknown: true };
    const { error, value } = schema.validate(req.body, options);

    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((d) => d.message)
      });
    }

    req.body = value;
    next();
  };
}

const cardSchema = Joi.object({
  front: Joi.string().min(1).required(),
  back: Joi.string().min(1).required(),
  example: Joi.string().allow('', null),
  orderIndex: Joi.number().integer().min(0).optional()
});

const createPracticeSetSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow('', null),
  category: Joi.string().valid('vocabulary', 'grammar', 'communication', 'other').required(),
  topic: Joi.string().min(1).required(),
  language: Joi.string().min(1).required(),
  courseId: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  published: Joi.boolean().optional(),
  cards: Joi.array().items(cardSchema).optional()
});

const updatePracticeSetSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  category: Joi.string().valid('vocabulary', 'grammar', 'communication', 'other'),
  topic: Joi.string(),
  language: Joi.string(),
  courseId: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  published: Joi.boolean()
});

const createCardSchema = cardSchema;
const updateCardSchema = cardSchema.min(1);
const reviewSchema = Joi.object({
  quality: Joi.number().integer().min(0).max(5).required()
});

export const validateCreatePracticeSet = validate(createPracticeSetSchema);
export const validateUpdatePracticeSet = validate(updatePracticeSetSchema);
export const validateCreateCard = validate(createCardSchema);
export const validateUpdateCard = validate(updateCardSchema);
export const validateReview = validate(reviewSchema);
