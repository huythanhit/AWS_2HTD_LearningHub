import React, { useEffect, useState } from 'react';
import { getPractices } from '../../services/memberService';
import { useNavigate } from 'react-router-dom';

export default function MemberPractices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPractices();
        if (!mounted) return;
        setItems(data || []);
      } catch (err) {
        setError(err?.message || 'Lỗi khi tải danh sách');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Bài luyện từ vựng & quiz</h2>
        </div>

        {loading && <div className="text-gray-500">Đang tải...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="text-gray-600">Không tìm thấy bài luyện nào.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.id} className="bg-gradient-to-br from-[#fbf7ff] to-[#f6eefc] border border-purple-100 rounded-xl p-5 flex flex-col h-full hover:shadow-lg transition-transform transform hover:-translate-y-1">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">{it.category || it.topic}</div>
                  <div className="text-xs text-gray-400">{it.language}</div>
                </div>

                <h3 className="font-semibold text-lg text-gray-800">{it.title}</h3>
                {it.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{it.description}</p>}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs text-gray-400">{it.created_at ? new Date(it.created_at).toLocaleDateString() : ''}</div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-gray-100 text-xs rounded text-gray-600">{it.cards ? `${it.cards.length} thẻ` : '—'}</div>
                  <button
                    onClick={() => navigate(`/member/practice/${it.id}`)}
                    className="bg-[#8c78ec] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#7a66d3] shadow-sm"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
