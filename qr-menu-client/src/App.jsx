import { Routes, Route } from 'react-router-dom';
import Menu from './pages/Menu';

function App() {
  const hostname = window.location.hostname;
  
  // SaaS ana domainleri veya yerel sunucu domainlerini tanımlıyoruz
  const baseDomains = ['localhost', '127.0.0.1', 'benimsistemim.com', 'qr-menu-saas.com'];
  const isCustomDomain = !baseDomains.includes(hostname) && !hostname.endsWith('.benimsistemim.com');

  if (isCustomDomain) {
    // Özel alan adlarında (White-Label) her rota doğrudan bu kafenin menüsünü göstersin
    return (
      <Routes>
        <Route path="*" element={<Menu />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* SaaS Ana Sitesi Ana Dizini */}
      <Route path="/" element={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-500 font-sans p-6 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">SaaS QR Menü Sistemi</h1>
          <p>Lütfen görüntülemek istediğiniz restoranın adresini giriniz.</p>
          <p className="text-sm mt-2 text-slate-400">Örnek: localhost:5174/lezzet-dunyasi</p>
        </div>
      } />
      
      {/* SaaS Ana Sitesi Üzerinden Slug İle Erişim (Örn: localhost:5174/lezzet-dunyasi) */}
      <Route path="/:slug" element={<Menu />} />
    </Routes>
  );
}

export default App;