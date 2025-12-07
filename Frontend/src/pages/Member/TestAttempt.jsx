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

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const data = await startExam(examId);
        if (!mounted) return;
        setSubmissionId(data.submissionId || data.submissionID || null);
        setExam(data.exam || null);
        setSecondsLeft(data.durationSeconds ?? null);
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
      const payload = Object.entries(answers).map(([qId, choiceIdxs]) => ({ questionId: qId, choices: choiceIdxs }));
      const res = await submitExam(submissionId, payload);
      // res expected: { submissionId, totalScore, result: {...} }
      setSubmissionResult(res || null);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error', err);
      setSubmissionResult(null);
      setError(err.message || String(err));
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
  if (error) return <div className="p-6 text-red-500">Lỗi: {error}</div>;
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
        {Array.isArray(exam.questions) && exam.questions.map((q, idx) => (
          <div key={q.question_id || q.exam_question_id || idx} className="bg-white p-4 rounded-xl border">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Câu {idx + 1} • {q.points ?? ''} điểm</div>
                <div className="font-semibold mt-1">{q.title}</div>
                {q.body && <div className="text-sm text-gray-600 mt-1">{q.body}</div>}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {Array.isArray(q.choices) && q.choices.map((c, ci) => {
                const selected = answers[q.question_id] ? answers[q.question_id].includes(ci) : false;
                return (
                  <label key={ci} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}>
                    <input
                      type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                      name={`q-${q.question_id}`}
                      checked={selected}
                      onChange={() => handleSelect(q.question_id, ci, q.type)}
                      className="form-radio text-indigo-600"
                    />
                    <div className="text-sm">{c.text}</div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
