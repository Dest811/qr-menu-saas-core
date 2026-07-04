import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// YENİ: Router'ı içe aktardık
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* YENİ: Tüm uygulamayı BrowserRouter ile sardık */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)