import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startExam, submitExam } from '../../services/memberService';
import { Clock, ArrowRight } from 'lucide-react';

export default function TestAttempt() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({}); // question_id -> array of chosen indices
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [serverErrors, setServerErrors] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const data = await startExam(examId);
        if (!mounted) return;
        const submission = data.submissionId || data.submissionID || null;
        const examObj = data.exam || null;
        setSubmissionId(submission);
        setExam(examObj);
        setSecondsLeft(data.durationSeconds ?? null);
        // optional: store started/expires
        // initialize empty answers object keyed by stable question id (question_id preferred)
        if (examObj && Array.isArray(examObj.questions)) {
          const init = {};
          examObj.questions.forEach(q => {
            const key = q.question_id ?? q.exam_question_id ?? q.questionId ?? q.id;
            if (key) init[key] = [];
          });
          setAnswers(init);
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, [examId]);

  // countdown timer
  useEffect(() => {
    if (secondsLeft == null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return s;
        if (s <= 1) {
          clearInterval(timerRef.current);
          // time's up - auto submit or disable
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [secondsLeft]);

  function formatTime(sec) {
    if (sec == null) return '--:--';
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  const handleSelect = (qId, choiceIdx, type) => {
    setAnswers(prev => {
      const cur = prev[qId] ? [...prev[qId]] : [];
      if (type === 'single_choice') {
        return { ...prev, [qId]: [choiceIdx] };
      }
      // multiple choice
      const exists = cur.includes(choiceIdx);
      if (exists) {
        return { ...prev, [qId]: cur.filter(i => i !== choiceIdx) };
      }
      cur.push(choiceIdx);
      return { ...prev, [qId]: cur };
    });
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    if (!submissionId) {
      alert('Không tìm thấy submissionId. Không thể nộp bài.');
      return;
    }
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      // Build payload in the shape expected by backend validators/graders.
      // For choice-based questions the backend expects: { answer: { selectedOptionIndexes: [..] } }
      // For short answer: { answer: { text: '...' } }
      const payload = Object.entries(answers).map(([qId, choiceIdxs]) => {
        // find question metadata from exam to know the type
        const question = (exam?.questions || []).find((q) => {
          const key = q.question_id ?? q.exam_question_id ?? q.questionId ?? q.id;
          return String(key) === String(qId);
        });

        // Normalize selected indexes into an array of numbers
        const normalizeIndexes = (v) => {
          if (v == null) return [];
          if (Array.isArray(v)) return v.map((n) => Number(n));
          return [Number(v)];
        };

        if (question) {
          const type = question.type;
          const isChoice = ['single_choice', 'multiple_choice', 'true_false', 'true_false_ng', 'image_choice', 'audio_choice'].includes(type);
          if (isChoice) {
            const selected = normalizeIndexes(choiceIdxs).filter((n) => !Number.isNaN(n));
            return { questionId: qId, answer: { selectedOptionIndexes: selected } };
          }

          if (type === 'short_answer') {
            // store as text
            const text = Array.isArray(choiceIdxs) ? (choiceIdxs[0] ?? '') : (choiceIdxs ?? '');
            return { questionId: qId, answer: { text } };
          }
        }

        // Fallback: send the raw value wrapped as answer
        return { questionId: qId, answer: Array.isArray(choiceIdxs) ? choiceIdxs : choiceIdxs };
      });
      const res = await submitExam(submissionId, payload);
      // res expected: { submissionId, totalScore, result: {...} }
      // ensure we store returned submissionId and the full result object
      if (res && res.submissionId) setSubmissionId(res.submissionId);
      setSubmissionResult(res || null);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error', err);
      setSubmissionResult(null);
      // Prefer structured server message if available
      const srv = err?.response?.data || err?.data || null;
      const msg = srv?.message || srv?.error || err.message || String(err);
      setError(msg);
      // store validation details for display
      setServerErrors(srv?.errors ?? srv ?? null);
      if (srv?.errors) console.debug('Validation errors from server:', srv.errors);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit when time runs out (if not already submitted)
  useEffect(() => {
    if (secondsLeft === 0 && !submitted && !submitting) {
      handleSubmit();
    }
  }, [secondsLeft, submitted, submitting]);

  if (loading) return <div className="p-6">Đang khởi tạo bài thi...</div>;
  if (error) return (
    <div className="p-6 text-red-500">
      <div>Lỗi: {error}</div>
      {serverErrors && (
        <div className="mt-3 bg-white p-3 rounded border text-sm text-gray-700">
          <div className="font-semibold mb-1">Chi tiết lỗi từ server:</div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(serverErrors, null, 2)}</pre>
        </div>
      )}
    </div>
  );
  if (!exam) return <div className="p-6">Không tìm thấy đề thi.</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          {exam.description && <p className="text-sm text-gray-600">{exam.description}</p>}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Thời gian còn lại</div>
          <div className="text-lg font-bold text-[#5a4d8c] flex items-center gap-2"><Clock size={16}/>{formatTime(secondsLeft)}</div>
        </div>
      </div>

      <div className="space-y-6">
        {Array.isArray(exam.questions) && exam.questions.map((q, idx) => {
          const qKey = q.question_id ?? q.exam_question_id ?? q.questionId ?? q.id ?? `q-${idx}`;
          return (
            <div key={qKey} className="bg-white p-4 rounded-xl border">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Câu {q.sequence ?? idx + 1} • {q.points ?? q.points ?? ''} điểm</div>
                  <div className="font-semibold mt-1">{q.title}</div>
                  {q.body && <div className="text-sm text-gray-600 mt-1">{q.body}</div>}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {Array.isArray(q.choices) && q.choices.map((c, ci) => {
                  const selected = answers[qKey] ? answers[qKey].includes(ci) : false;
                  return (
                    <label key={ci} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}>
                      <input
                        type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                        name={`q-${qKey}`}
                        checked={selected}
                        onChange={() => handleSelect(qKey, ci, q.type)}
                        className="form-radio text-indigo-600"
                      />
                      <div className="text-sm">{c.text}</div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${submitting ? 'bg-gray-200 text-gray-500' : 'bg-[#8c78ec] text-white'}`}>
            {submitting ? 'Đang nộp...' : 'Nộp bài'} { !submitting && <ArrowRight size={16}/> }
          </button>
        ) : (
          <div className="w-full max-w-md bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-2">Kết quả đã nộp</h3>
            {submissionResult ? (
              <div className="text-sm text-gray-700 space-y-2">
                <div><strong>Điểm tổng:</strong> {submissionResult.totalScore ?? submissionResult.total_score ?? 0}</div>
                <div><strong>Số câu đúng:</strong> {submissionResult.result?.correctCount ?? submissionResult.result?.correct_count ?? '-' } / {submissionResult.result?.totalQuestions ?? submissionResult.result?.total_questions ?? '-' }</div>
                <div><strong>Tỷ lệ:</strong> {submissionResult.result?.percentage ?? submissionResult.result?.percentage ?? 0}%</div>
                <div><strong>Đậu:</strong> {submissionResult.result?.passed ? 'Có' : 'Không'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Không có dữ liệu kết quả.</div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => navigate('/member/test')} className="px-4 py-2 border rounded-lg">Quay lại danh sách</button>
              {(submissionResult?.submissionId || submissionId) && (
                <button onClick={() => navigate(`/member/submission/${submissionResult?.submissionId || submissionId}`)} className="px-4 py-2 bg-[#8c78ec] text-white rounded-lg">Xem chi tiết</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
