import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // YENİ: Link özelliğini kullanabilmek için ekledik

const API_BASE_URL = 'https://qr-menu-saas-core.onrender.com';

export default function Admin() {
  const [cafes, setCafes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  
  const [cafeName, setCafeName] = useState('');
  const [cafeSlug, setCafeSlug] = useState('');
  const [cafeCustomDomain, setCafeCustomDomain] = useState('');
  const [stats, setStats] = useState({ totalCafes: 0, totalActiveProducts: 0 });
  const [isSavingCafe, setIsSavingCafe] = useState(false);

  useEffect(() => {
    fetchCafes();
    fetchStats();
  }, []);

  const getHeaders = (extra = {}) => {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': `Bearer ${token}`,
      ...extra
    };
  };

  const handleAuthError = (response) => {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('adminToken');
      window.location.reload();
      return true;
    }
    return false;
  };

  const fetchCafes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cafes`, {
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setCafes(data);
    } catch (error) {
      console.error("Error fetching cafes:", error);
    } finally {
      setIsLoading(false); 
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCafeNameChange = (e) => {
    const inputName = e.target.value;
    setCafeName(inputName);
    
    const generatedSlug = inputName
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    setCafeSlug(generatedSlug);
  };

  const handleCafeSlugChange = (e) => {
    const manualSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ''); 
      
    setCafeSlug(manualSlug);
  };

  const handleSaveCafe = async (e) => {
    e.preventDefault(); 
    if (!cafeName || !cafeSlug) {
      alert("Kafe adı ve sistem linki zorunludur.");
      return;
    }
    setIsSavingCafe(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cafes`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
          name: cafeName.trim(), 
          slug: cafeSlug.trim(), 
          custom_domain: cafeCustomDomain ? cafeCustomDomain.trim() : null 
        }),
      });
      
      if (handleAuthError(response)) return;
      
      if (response.ok) {
        const newCafe = await response.json();
        setCafes([newCafe, ...cafes]); 
        setCafeName('');
        setCafeSlug('');
        setCafeCustomDomain('');
        setIsModalOpen(false);
        fetchStats();
        alert("Kafe başarıyla oluşturuldu!");
      } else {
        const errorData = await response.json();
        console.error("Kafe ekleme sunucu hatası:", errorData);
        alert("Kafe oluşturulamadı: " + (errorData.error || "Bilinmeyen hata. Sistem linki (slug) veya alan adı kullanımda olabilir."));
      }
    } catch (error) {
      console.error("Kafe kaydetme bağlantı hatası:", error);
      alert("Kafe oluşturulamadı, lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsSavingCafe(false);
    }
  };

  const handleDeleteCafe = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cafes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (handleAuthError(response)) return;
      
      if (response.ok) {
        const updatedList = cafes.filter((cafe) => cafe.id !== id);
        setCafes(updatedList);
        fetchStats();
      }
    } catch (error) {
      console.error("Error deleting cafe:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto relative">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 border-b border-slate-700 pb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SaaS Kontrol Merkezi
          </h1>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial text-center bg-blue-600 hover:bg-blue-500 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/50 cursor-pointer text-sm sm:text-base"
            >
              + Yeni Kafe Ekle
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                window.location.reload();
              }}
              className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-4 py-2 rounded-lg font-semibold text-slate-300 transition-all cursor-pointer text-sm sm:text-base"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 animate-pulse">Veritabanına bağlanılıyor...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h3 className="text-slate-400 mb-2 font-medium">Toplam Kafe (Müşteri)</h3>
                <p className="text-4xl font-bold">{cafes.length}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h3 className="text-slate-400 mb-2 font-medium">Aktif Ürün Sayısı</h3>
                <p className="text-4xl font-bold">{stats.totalActiveProducts}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-emerald-900 shadow-xl">
                <h3 className="text-slate-400 mb-2 font-medium">Veritabanı Durumu</h3>
                <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            
            {cafes.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center shadow-xl">
                <div className="text-6xl mb-4">🏪</div>
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Henüz Kafe Bulunmuyor</h2>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  Sistemde hiç müşteri kaydı yok. Yukarıdaki "Yeni Kafe Ekle" butonunu kullanarak ilk müşterinizi sisteme dahil edebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cafes.map((cafe) => (
                  <Link 
                    key={cafe.id} 
                    to={`/admin/cafe/${cafe.id}`}
                    className="relative bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-blue-500 hover:bg-slate-750 hover:shadow-blue-900/20 transition-all cursor-pointer group block"
                  >
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); 
                        if (window.confirm(`"${cafe.name}" kafesini ve ilgili verileri silmek istediğinizden emin misiniz?`)) {
                          handleDeleteCafe(cafe.id);
                        }
                      }}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors z-10"
                      title="Kafeyi Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <h3 className="text-2xl font-bold mb-2 pr-8 text-white group-hover:text-blue-400 transition-colors">{cafe.name}</h3>
                    <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                      <div>Bağlantı: <span className="text-blue-400 font-mono">/{cafe.slug}</span></div>
                      {cafe.custom_domain && (
                        <div>Alan Adı: <span className="text-emerald-400 font-mono">{cafe.custom_domain}</span></div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">Yeni Kafe Oluştur</h2>
              
              <form onSubmit={handleSaveCafe}>
                <div className="mb-4">
                  <label className="block text-slate-400 mb-2 font-medium">Kafe Adı</label>
                  <input 
                    type="text" 
                    required
                    value={cafeName}
                    onChange={handleCafeNameChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Örn: Lezzet Dünyası"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-slate-400 mb-2 font-medium">Sistem Linki (Düzenlenebilir)</label>
                  <div className="flex bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <input 
                      type="text" 
                      required
                      value={cafeSlug}
                      onChange={handleCafeSlugChange}
                      className="w-full bg-transparent p-3 text-emerald-400 outline-none"
                      placeholder="lezzet-dunyasi"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-slate-400 mb-2 font-medium">Özel Alan Adı (Custom Domain - İsteğe Bağlı)</label>
                  <input 
                    type="text" 
                    value={cafeCustomDomain}
                    onChange={(e) => setCafeCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Örn: altinbalik.com"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingCafe}
                    className={`bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-bold text-white transition-colors ${isSavingCafe ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSavingCafe ? 'Kaydediliyor...' : 'Sisteme Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}