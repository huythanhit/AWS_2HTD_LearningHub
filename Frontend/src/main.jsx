// fileName: main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Import App
import './index.css' 

// Loại bỏ: import { BrowserRouter } from 'react-router-dom';
// Loại bỏ: Bọc <App /> bằng <BrowserRouter>

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)