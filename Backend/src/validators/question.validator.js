// src/validators/question.validator.js
import Joi from 'joi';

// Các field chung cho mọi loại câu hỏi
const baseFields = {
  title: Joi.string().max(255).allow('', null),
  body: Joi.string().allow('', null), // mô tả, đoạn văn, hướng dẫn...
  difficulty: Joi.number().integer().min(1).max(5).optional(),
  tags: Joi.array().items(Joi.string()).optional()
};

// Option dùng cho các dạng trắc nghiệm (có thể kèm ảnh / audio)
const optionSchema = Joi.object({
  text: Joi.string().allow('', null), // nội dung đáp án
  imageUrl: Joi.string().uri().allow(null), // dùng cho image_choice
  audioUrl: Joi.string().uri().allow(null), // dùng cho audio_choice
  value: Joi.string().allow(null), // ví dụ: "T", "F", "NG"
  isCorrect: Joi.boolean().required()
});

// Schema chính tạo câu hỏi (dùng cho /questions)
export const createQuestionSchema = Joi.object({
  ...baseFields,

  type: Joi.string()
    .valid(
      // loại cũ
      'single_choice',
      'multiple_choice',
      'true_false',
      'short_answer',
      // loại mới
      'true_false_ng',
      'cloze_single',
      'cloze_multiple',
      'image_choice',
      'audio_choice'
    )
    .required(),

  // choices thay đổi tùy theo type
  choices: Joi.when('type', {
    // Các dạng trắc nghiệm (kể cả true/false/ng, image, audio)
    is: Joi.valid(
      'single_choice',
      'multiple_choice',
      'true_false',
      'true_false_ng',
      'image_choice',
      'audio_choice'
    ),
    then: Joi.array().items(optionSchema).min(2).required(),

    // Các dạng còn lại dùng cấu trúc object riêng (đục lỗ, short_answer)
    otherwise: Joi.when('type', {
      is: Joi.valid('cloze_single', 'cloze_multiple', 'short_answer'),
      // Ở backend mình chỉ cần biết nó là 1 object,
      // FE / service sẽ quy ước cấu trúc chi tiết
      then: Joi.object().required(),
      otherwise: Joi.forbidden()
    })
  })
});

// Schema dùng khi tạo câu hỏi TRONG exam
export const createQuestionInExamSchema = createQuestionSchema.keys({
  points: Joi.number().min(0).default(1),
  sequence: Joi.number().integer().min(1).optional()
});
