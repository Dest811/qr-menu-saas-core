import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://qr-menu-saas-core.onrender.com');

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        
        const role = data.role || (data.cafe ? 'cafe_owner' : 'superadmin');
        const cafeId = data.cafe?.id || data.cafeId;

        if (role) localStorage.setItem('userRole', role);
        if (cafeId) localStorage.setItem('userCafeId', String(cafeId));

        if (role === 'cafe_owner' && cafeId) {
          navigate(`/admin/cafe/${cafeId}`, { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        setError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      console.error(err);
      setError('Sunucu bağlantı hatası. Backend çalışıyor mu?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-600 text-white text-3xl mb-4 shadow-lg shadow-blue-500/20">
            🔐
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SaaS Giriş Paneli
          </h1>
          <p className="text-slate-400 text-sm mt-2">Yönetim merkezine erişmek için giriş yapın.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Kullanıcı Adı</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              placeholder="Kullanıcı adınız veya admin"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Şifre</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold p-3.5 rounded-xl shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
