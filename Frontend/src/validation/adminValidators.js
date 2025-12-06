import * as Yup from 'yup';

export const courseValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Tên khóa học là bắt buộc')
    .min(3, 'Tên khóa học phải có ít nhất 3 ký tự')
    .max(200, 'Tên khóa học không được vượt quá 200 ký tự'),
  slug: Yup.string()
    .nullable()
    .notRequired()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug chỉ được chứa chữ cái, số và gạch ngang')
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .max(100, 'Slug tối đa 100 ký tự'),
  shortDescription: Yup.string()
    .required('Mô tả ngắn là bắt buộc')
    .min(10, 'Mô tả ngắn phải có ít nhất 10 ký tự')
    .max(500, 'Mô tả ngắn tối đa 500 ký tự'),
  description: Yup.string()
    .required('Mô tả chi tiết là bắt buộc')
    .min(10, 'Mô tả chi tiết phải có ít nhất 10 ký tự')
    .max(2000, 'Mô tả chi tiết tối đa 2000 ký tự'),
});

export const userValidationSchema = Yup.object().shape({
  full_name: Yup.string()
    .required('Họ và tên là bắt buộc')
    .min(3, 'Họ tên phải có ít nhất 3 ký tự')
    .max(120, 'Họ tên không được vượt quá 120 ký tự'),
  email: Yup.string()
    .required('Email là bắt buộc')
    .email('Email không hợp lệ'),
  phone: Yup.string()
    .nullable()
    .notRequired()
    .test('phone-or-empty', 'Số điện thoại không hợp lệ', function (value) {
      if (!value) return true; // allow empty
      return /^\+?[0-9\s\-()]{6,20}$/.test(value);
    }),
  password: Yup.string()
    .when('$isCreate', {
      is: true,
      then: Yup.string().required('Mật khẩu là bắt buộc').min(6, 'Mật khẩu tối thiểu 6 ký tự'),
      otherwise: Yup.string().notRequired()
    }),
  role: Yup.string().required('Role là bắt buộc')
});

// helper to run validation and return map of errors
export async function validateSchema(schema, data, context = {}) {
  try {
    await schema.validate(data, { abortEarly: false, context });
    return {};
  } catch (err) {
    const out = {};
    if (err.inner && err.inner.length) {
      err.inner.forEach(e => { if (e.path) out[e.path] = e.message; });
    } else if (err.path) {
      out[err.path] = err.message;
    }
    return out;
  }
}
