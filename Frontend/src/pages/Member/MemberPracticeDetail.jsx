import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPracticeStudy, getPracticeById } from '../../services/memberService';

function MediaPreview({ imageKey, audioKey }) {
  // Basic placeholders: if you have a full S3 URL builder, replace here
  const imageUrl = imageKey ? imageKey : null;
  const audioUrl = audioKey ? audioKey : null;

  return (
    <div className="space-y-2">
      {imageUrl && <img src={imageUrl} alt="card" className="w-40 h-28 object-cover rounded" />}
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
}

export default function MemberPracticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deckMeta, setDeckMeta] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // fetch deck metadata too (optional)
        const meta = await getPracticeById(id).catch(() => null);
        if (!mounted) return;
        setDeckMeta(meta || null);

        const list = await getPracticeStudy(id, 50);
        if (!mounted) return;
        setCards(list || []);
      } catch (err) {
        setError(err?.message || 'Lỗi khi tải thẻ học');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const prev = () => {
    setFlipped(false);
    setIndex(i => (cards && cards.length ? (i <= 0 ? cards.length - 1 : i - 1) : 0));
  };
  const next = () => {
    setFlipped(false);
    setIndex(i => (cards && cards.length ? (i >= cards.length - 1 ? 0 : i + 1) : 0));
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!cards || cards.length === 0) return <div className="p-6">Không có thẻ để học.</div>;

  const card = cards[index];

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{deckMeta?.title || 'Bộ thẻ'}</h1>
            <div className="text-sm text-gray-500 mt-1">{deckMeta?.category} • {deckMeta?.topic} • {deckMeta?.language}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Thẻ {index + 1} / {cards.length}</div>
            <button onClick={() => navigate('/member/practices')} className="mt-2 text-sm text-indigo-600">Quay lại</button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div
              className="relative bg-gradient-to-br from-[#f6eefc] to-[#f0e9fb] border border-purple-100 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgba(140,120,236,0.12)] hover:shadow-[0_18px_40px_rgba(140,120,236,0.16)] transition-transform transform hover:-translate-y-1 cursor-pointer select-none active:scale-95"
              style={{ perspective: '1000px' }}
              onClick={() => setFlipped(f => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped(f => !f); }}
            >
              <div className="absolute left-6 top-6 text-sm text-gray-400">{card.order_index !== undefined ? `#${card.order_index}` : ''}</div>

              <div className="mx-auto max-w-2xl min-h-[180px] flex items-center justify-center">
                <div
                  className="w-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 450ms ease',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front Face */}
                  <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'relative' }}>
                      <div className="text-4xl md:text-5xl font-extrabold mb-4 text-purple-900">{card.front || '—'}</div>
                    {card.image_s3_key || card.audio_s3_key ? (
                      <div className="mb-4 flex justify-center">
                        <MediaPreview imageKey={card.image_s3_key} audioKey={card.audio_s3_key} />
                      </div>
                    ) : null}
                    <div className="text-sm text-purple-700 mt-2">Nhấn vào thẻ để xem nghĩa / ví dụ</div>
                  </div>

                  {/* Back Face */}
                  <div style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-4xl md:text-5xl font-extrabold mb-4 text-purple-900">{card.back || '—'}</div>
                    {card.example && <div className="text-sm text-purple-700 italic mb-2">Ví dụ: {card.example}</div>}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-purple-100 rounded-full mt-6 overflow-hidden">
                <div className="h-2 bg-purple-500 rounded-full transition-all" style={{ width: `${Math.round(((index + 1) / cards.length) * 100)}%` }}></div>
              </div>

              {/* Controls (prev/next only) */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={(e) => { e.stopPropagation(); prev(); }} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">Trước</button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">Tiếp</button>
              </div>
              <div className="text-xs text-purple-700 mt-3">Nhấn vào thẻ để xem nghĩa / ví dụ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

