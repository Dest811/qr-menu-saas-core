import { Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import CafeDetail from './pages/CafeDetail';
import Login from './pages/Login';

// Yetkilendirme kontrolü sağlayan wrapper bileşen
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* 1. Giriş Sayfası */}
      <Route path="/login" element={<Login />} />

      {/* 2. Ana Admin Paneli (Korumalı Rota) */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      
      {/* 3. Müşteri Kafe Detay Paneli (Korumalı Rota) */}
      <Route path="/admin/cafe/:id" element={
        <ProtectedRoute>
          <CafeDetail />
        </ProtectedRoute>
      } />

      {/* 4. Tanımsız veya boş rota durumunda doğrudan Admin paneline yönlendir */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;