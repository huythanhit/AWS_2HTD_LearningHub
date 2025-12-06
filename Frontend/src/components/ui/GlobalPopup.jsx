import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function GlobalPopup() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('success');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmResolveRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {};
      setType(payload.type || 'success');
      setTitle(payload.title || (payload.type === 'error' ? 'Lỗi' : 'Thành công'));
      setMessage(payload.message || '');
      setOpen(true);
    };

    window.addEventListener('global-popup', handler);

    // expose helper for legacy calls
    if (!window.showGlobalPopup) {
      window.showGlobalPopup = (opts = {}) => {
        const event = new CustomEvent('global-popup', { detail: opts });
        window.dispatchEvent(event);
      };

      // confirm helper: returns a Promise<boolean>
      if (!window.showGlobalConfirm) {
        window.showGlobalConfirm = (msg = 'Bạn có chắc chắn?') => {
          return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmMessage(msg);
            setConfirmOpen(true);
          });
        };
      }

      // Override native alert to forward to our popup so existing alert(...) calls show the modal
      try {
        if (!window.__originalAlert) window.__originalAlert = window.alert;
        window.alert = (msg) => {
          const text = msg == null ? '' : String(msg);
          const low = text.toLowerCase();
          // detect explicit success keywords; default to ERROR for ambiguous messages
          const successRe = /thành công|success|ok|completed/;
          const isSuccess = successRe.test(low);
          const type = isSuccess ? 'success' : 'error';
          window.showGlobalPopup({ type, message: text });
        };
      } catch (e) {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('global-popup', handler);
      try {
        if (window.__originalAlert) {
          window.alert = window.__originalAlert;
          delete window.__originalAlert;
        }
      } catch (e) {}
      try { delete window.showGlobalPopup; } catch (e) {}
      try { delete window.showGlobalConfirm; } catch (e) {}
    };
  }, []);

  const icon = type === 'success' ? (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="mb-4">
      <circle cx="12" cy="12" r="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
      <path d="M7 13l3 3 7-8" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="mb-4">
      <circle cx="12" cy="12" r="10" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Notification modal */}
      {open && (
        <div style={{ zIndex: 99999 }} className="fixed inset-0 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="flex flex-col items-center">
              {icon}
              <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
              {message && <p className="text-sm text-gray-500 mb-6">{message}</p>}
              <button
                onClick={() => setOpen(false)}
                className="px-6 py-2 rounded-xl bg-[#5a4d8c] text-white font-semibold hover:bg-[#483d73]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal (returns promise) */}
      {confirmOpen && (
        <div style={{ zIndex: 100000 }} className="fixed inset-0 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setConfirmOpen(false); if (confirmResolveRef.current) { confirmResolveRef.current(false); confirmResolveRef.current = null; } }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmMessage}</p>
            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 border rounded-lg" onClick={() => { setConfirmOpen(false); if (confirmResolveRef.current) { confirmResolveRef.current(false); confirmResolveRef.current = null; } }}>Hủy</button>
              <button className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg" onClick={() => { setConfirmOpen(false); if (confirmResolveRef.current) { confirmResolveRef.current(true); confirmResolveRef.current = null; } }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
