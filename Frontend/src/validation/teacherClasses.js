import * as Yup from 'yup';

/**
 * Validation Schema cho Lecture Form
 * Sử dụng trong TeacherClasses component
 */
export const lectureValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Tiêu đề bài giảng là bắt buộc')
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  contentType: Yup.string()
    .required('Loại nội dung là bắt buộc'),
  s3Key: Yup.string()
    .required('S3 Key / URL nội dung là bắt buộc')
    .min(5, 'S3 Key phải có ít nhất 5 ký tự'),
  durationSeconds: Yup.number()
    .required('Thời lượng là bắt buộc')
    .min(0, 'Thời lượng phải lớn hơn hoặc bằng 0')
    .integer('Thời lượng phải là số nguyên'),
  orderIndex: Yup.number()
    .required('Thứ tự bài là bắt buộc')
    .min(1, 'Thứ tự bài phải lớn hơn hoặc bằng 1')
    .integer('Thứ tự bài phải là số nguyên'),
  published: Yup.boolean()
});

