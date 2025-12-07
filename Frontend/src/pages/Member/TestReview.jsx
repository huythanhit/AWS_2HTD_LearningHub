import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionReview } from '../../services/memberService';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function TestReview() {
  const { id: submissionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSubmissionReview(submissionId);
        if (!mounted) return;
        setReview(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [submissionId]);

  if (loading) return <div className="p-6">Đang tải kết quả chi tiết...</div>;
  if (error) return <div className="p-6 text-red-500">Lỗi: {error}</div>;
  if (!review) return <div className="p-6">Không tìm thấy kết quả.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="px-3 py-2 rounded-lg border flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h1 className="text-2xl font-bold">Xem kết quả chi tiết</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Đề thi</div>
            <div className="font-bold text-lg">{review.examTitle ?? review.exam_title ?? '-'}</div>
            <div className="mt-2 text-sm text-gray-600">Mã đề: {review.examId ?? review.exam_id ?? '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Mã nộp</div>
            <div className="font-mono text-sm">{review.submissionId}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-sm text-gray-600">Điểm tổng: <strong>{review.totalScore ?? review.total_score ?? '-'}</strong></div>
          <div className="text-sm text-gray-600">Nộp lúc: <strong>{review.submittedAt ? new Date(review.submittedAt).toLocaleString() : 'Chưa nộp'}</strong></div>
          <div className="text-sm text-gray-600">Tóm tắt:
            <div className="mt-1">
              {(() => {
                const s = review.summary;
                if (s == null) return (<strong>-</strong>);
                if (typeof s === 'string') return (<strong>{s}</strong>);
                // if summary is an object that looks like a result, render key fields
                if (typeof s === 'object') {
                  const maybeResult = s;
                  if (maybeResult.percentage !== undefined || maybeResult.totalQuestions !== undefined) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div>Điểm: <strong>{maybeResult.totalScore ?? maybeResult.total_score ?? '-'}</strong></div>
                        <div>Đúng: <strong>{maybeResult.correctCount ?? maybeResult.correct_count ?? '-'}</strong></div>
                        <div>Tỷ lệ: <strong>{maybeResult.percentage ?? '-'}%</strong></div>
                      </div>
                    );
                  }
                  // fallback: pretty-print object
                  return <pre className="whitespace-pre-wrap text-sm p-2 bg-gray-50 rounded">{JSON.stringify(s, null, 2)}</pre>;
                }
                return (<strong>{String(s)}</strong>);
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Array.isArray(review.items) && review.items.length > 0 ? (
          review.items.map((it, idx) => {
            // match backend shape provided
            const qTitle = it.title ?? it.questionTitle ?? it.question?.title ?? 'Không có nội dung';
            const qId = it.questionId ?? it.id ?? it.question?.id ?? idx;
            const awarded = it.awardedPoints ?? it.awarded_points ?? it.score ?? it.points ?? 0;
            const max = it.maxPoints ?? it.max_points ?? it.max_score ?? it.max ?? '-';
            const choices = Array.isArray(it.choices) ? it.choices : [];
            const selectedIndexes = it.studentAnswer?.selectedOptionIndexes ?? it.studentAnswer?.selectedIndexes ?? it.selectedOptionIndexes ?? [];
            const sequence = it.sequence ?? it.seq ?? idx + 1;

            return (
              <div key={qId} className="bg-white p-4 rounded-xl border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-500">Câu {sequence}</div>
                    <div className="font-semibold mt-1">{qTitle}</div>
                    {it.body && <div className="text-sm text-gray-600 mt-1">{it.body}</div>}
                  </div>
                  <div className="text-sm text-gray-600 text-right">
                    <div>Điểm: <strong>{awarded}/{max}</strong></div>
                    <div className="mt-1">Loại: <strong>{it.type ?? it.questionType ?? '-'}</strong></div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {choices.map((ch, ci) => {
                    const isSelected = Array.isArray(selectedIndexes) ? selectedIndexes.includes(ci) : selectedIndexes === ci;
                    const isCorrect = !!ch.isCorrect;
                    return (
                      <div key={ci} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isSelected ? 'bg-indigo-50 border-indigo-100' : 'bg-white hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{ch.text ?? ch.label ?? `Option ${ci+1}`}</div>
                          <div className="text-xs text-gray-400">{ch.value ?? ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCorrect && <CheckCircle size={18} className="text-emerald-600" />}
                          {isSelected && !isCorrect && <XCircle size={18} className="text-rose-500" />}
                        </div>
                      </div>
                    );
                  })}

                  {it.feedback && <div className="mt-2 text-sm text-gray-700">Phản hồi: {it.feedback}</div>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500">Hiện chưa có chi tiết kết quả cho bài làm này.</div>
        )}
      </div>
    </div>
  );
}
