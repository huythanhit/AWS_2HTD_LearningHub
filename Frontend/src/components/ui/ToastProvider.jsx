import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * ToastProvider Component
 * Bọc toàn bộ ứng dụng để cung cấp toast notifications
 * Sử dụng trong App.jsx để bọc toàn bộ app
 */
export default function ToastProvider({ children }) {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontSize: '14px'
        }}
      />
    </>
  );
}

