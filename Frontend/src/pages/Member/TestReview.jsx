import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionReview } from '../../services/memberService';
import { ArrowLeft } from 'lucide-react';

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

  if (loading) return <div className="p-6">Đang tải kết quả rà soát...</div>;
  if (error) return <div className="p-6 text-red-500">Lỗi: {error}</div>;
  if (!review) return <div className="p-6">Không tìm thấy kết quả.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="px-3 py-2 rounded-lg border flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h1 className="text-2xl font-bold">Rà soát bài làm</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <div className="text-sm text-gray-500">Đề thi</div>
        <div className="font-bold text-lg">{review.examTitle ?? review.exam_title ?? '-'}</div>
        <div className="mt-2 text-sm text-gray-600">Mã nộp: {review.submissionId}</div>
        <div className="mt-2 text-sm text-gray-600">Điểm tổng: <strong>{review.totalScore ?? review.total_score ?? '-'}</strong></div>
        <div className="mt-1 text-sm text-gray-600">Nộp lúc: {review.submittedAt ? new Date(review.submittedAt).toLocaleString() : '-'}</div>
        {review.summary && <div className="mt-3 text-sm text-gray-700">{review.summary}</div>}
      </div>

      <div className="space-y-4">
        {Array.isArray(review.items) && review.items.length > 0 ? (
          review.items.map((it, idx) => (
            <div key={it.questionId ?? it.id ?? idx} className="bg-white p-4 rounded-xl border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm text-gray-500">Câu {idx + 1}</div>
                  <div className="font-semibold mt-1">{it.questionTitle ?? it.title ?? it.question?.title ?? 'Không có nội dung'}</div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Điểm: <strong>{it.score ?? it.points ?? '-'}</strong></div>
                  <div>Trạng thái: <strong>{it.correct ? 'Đúng' : it.correct === false ? 'Sai' : '-'}</strong></div>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-700">
                {it.feedback && <div className="mb-2">Phản hồi: {it.feedback}</div>}

                {Array.isArray(it.selectedChoices) && (
                  <div className="mb-1">Lựa chọn của bạn:
                    <ul className="list-disc ml-6">
                      {it.selectedChoices.map((c, ci) => (
                        <li key={ci}>{c.text ?? c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(it.correctChoices) && (
                  <div className="mb-1">Đáp án đúng:
                    <ul className="list-disc ml-6">
                      {it.correctChoices.map((c, ci) => (
                        <li key={ci}>{c.text ?? c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">Hiện chưa có chi tiết rà soát cho bài làm này.</div>
        )}
      </div>
    </div>
  );
}
