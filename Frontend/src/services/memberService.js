import apiClient from './https';

// Fetch public exams list
export async function getPublicExams() {
  try {
    const res = await apiClient.get('/api/tests/public-exams');
    // Expected shape: { success: true, message, data: [ ...exams ] }
    const body = res.data;
    if (body && Array.isArray(body.data)) return body.data;
    // fallback: if API returns array directly
    if (Array.isArray(body)) return body;
    return [];
  } catch (err) {
    // Let https.js interceptor standardize the error message
    throw err;
  }
}



// Start an exam (create submission) and return the exam + submission info
export async function startExam(examId) {
  try {
    const res = await apiClient.post(`/api/tests/exams/${examId}/start`);
    const body = res.data;
    // Expected shape: { success: true, message, data: { submissionId, exam, startedAt, durationSeconds, expiresAt } }
    return body.data;
  } catch (err) {
    throw err;
  }
}

// Submit an exam (finalize a submission)
export async function submitExam(submissionId, answers) {
  try {
    const payload = { answers };
    const res = await apiClient.post(`/api/tests/submissions/${submissionId}/submit`, payload);
    // Expected shape: { success: true, message, data: { submissionId, totalScore, result: {...} } }
    return res.data.data;
  } catch (err) {
    throw err;
  }
}

// Get current user's submissions (history)
export async function getMySubmissions() {
  try {
    const res = await apiClient.get('/api/tests/my-submissions');
    const body = res.data;
    if (body && Array.isArray(body.data)) return body.data;
    if (Array.isArray(body)) return body;
    return [];
  } catch (err) {
    throw err;
  }
}

// Get review details for a submission
export async function getSubmissionReview(submissionId) {
  try {
    const res = await apiClient.get(`/api/tests/submissions/${submissionId}/review`);
    // Expected shape: { success: true, message, data: { submissionId, examId, examTitle, totalScore, submittedAt, summary, items } }
    return res.data.data;
  } catch (err) {
    throw err;
  }
}

// add to default export for convenience
export default {
  getPublicExams,
  getSubmissionReview,
};
