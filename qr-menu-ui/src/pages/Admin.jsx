import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { getAuthUser, logout } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://qr-menu-saas-core.onrender.com');

export default function Admin() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  // Kafe Sahibi ise doğrudan kendi kafe yönetim ekranına yönlendir
  if (authUser && authUser.role === 'cafe_owner' && authUser.cafeId) {
    return <Navigate to={`/admin/cafe/${authUser.cafeId}`} replace />;
  }

  const [cafes, setCafes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null); // null: Yeni ekle, obj: Düzenle
  const [isLoading, setIsLoading] = useState(true); 
  
  const [cafeName, setCafeName] = useState('');
  const [cafeSlug, setCafeSlug] = useState('');
  const [cafeUsername, setCafeUsername] = useState('');
  const [cafePassword, setCafePassword] = useState('');
  const [cafeCustomDomain, setCafeCustomDomain] = useState('');
  const [stats, setStats] = useState({ totalCafes: 0, totalActiveProducts: 0 });
  const [isSavingCafe, setIsSavingCafe] = useState(false);

  // --- BİLDİRİM / TOAST STATE'İ (Z-INDEX 9999) ---
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
      logout();
      window.location.href = '/login';
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

  const openCreateModal = () => {
    setEditingCafe(null);
    setCafeName('');
    setCafeSlug('');
    setCafeUsername('');
    setCafePassword('');
    setCafeCustomDomain('');
    setIsModalOpen(true);
  };

  const openEditModal = (cafe, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingCafe(cafe);
    setCafeName(cafe.name || '');
    setCafeSlug(cafe.slug || '');
    setCafeUsername(cafe.username || cafe.slug || '');
    setCafePassword(''); // Düzenlemede şifre varsayılan boş bırakılır
    setCafeCustomDomain(cafe.custom_domain || '');
    setIsModalOpen(true);
  };

  const handleCafeNameChange = (e) => {
    const inputName = e.target.value;
    setCafeName(inputName);
    
    // Otomatik slug ve varsayılan kullanıcı adı oluştur
    if (!editingCafe) {
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
      setCafeUsername(generatedSlug);
    }
  };

  const handleCafeSlugChange = (e) => {
    const manualSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ''); 
      
    setCafeSlug(manualSlug);
    if (!editingCafe && (!cafeUsername || cafeUsername === cafeSlug)) {
      setCafeUsername(manualSlug);
    }
  };

  const handleSaveCafe = async (e) => {
    e.preventDefault(); 
    if (!cafeName.trim() || !cafeSlug.trim()) {
      showToast("Kafe adı ve sistem linki (slug) zorunludur.", "error");
      return;
    }
    setIsSavingCafe(true);

    const payload = {
      name: cafeName.trim(), 
      slug: cafeSlug.trim(), 
      username: cafeUsername ? cafeUsername.trim() : cafeSlug.trim(),
      custom_domain: cafeCustomDomain ? cafeCustomDomain.trim() : null 
    };

    if (cafePassword && cafePassword.trim() !== '') {
      payload.password = cafePassword.trim();
    }

    try {
      const url = editingCafe 
        ? `${API_BASE_URL}/api/cafes/${editingCafe.id}` 
        : `${API_BASE_URL}/api/cafes`;
      
      const method = editingCafe ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      
      if (handleAuthError(response)) return;
      
      if (response.ok) {
        const savedCafe = await response.json();
        if (editingCafe) {
          setCafes(prev => prev.map(c => c.id === savedCafe.id ? savedCafe : c));
          showToast("Kafe bilgileri başarıyla güncellendi!", "success");
        } else {
          setCafes(prev => [savedCafe, ...prev]); 
          showToast("Kafe ve giriş bilgileri başarıyla oluşturuldu!", "success");
        }
        setIsModalOpen(false);
        fetchStats();
      } else {
        const errorData = await response.json();
        console.error("Kafe kaydetme sunucu hatası:", errorData);
        showToast(errorData.error || "İşlem başarısız. Sistem linki, alan adı veya kullanıcı adı kullanımda olabilir.", "error");
      }
    } catch (error) {
      console.error("Kafe kaydetme bağlantı hatası:", error);
      showToast("Bağlantı hatası: Lütfen internetinizi kontrol edin.", "error");
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
        setCafes(prev => prev.filter((cafe) => cafe.id !== id));
        showToast("Kafe başarıyla silindi.", "success");
        fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Kafe silinemedi.", "error");
      }
    } catch (error) {
      console.error("Error deleting cafe:", error);
      showToast("Kafe silinirken bağlantı hatası oluştu.", "error");
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 font-sans">
      {/* Toast Bildirim Katmanı (Z-INDEX: 9999) */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 transition-all animate-bounce ${
          toast.type === 'error' 
            ? 'bg-red-950/90 border-red-500 text-red-200' 
            : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
        }`}>
          <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              SaaS Kontrol Merkezi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Süper Admin Yönetim Paneli</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
            <button 
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial text-center bg-blue-600 hover:bg-blue-500 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/50 cursor-pointer text-sm sm:text-base"
            >
              + Yeni Kafe Ekle
            </button>
            <button 
              onClick={handleLogoutClick}
              className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-4 py-2 rounded-lg font-semibold text-slate-300 transition-all cursor-pointer text-sm sm:text-base flex items-center gap-2"
            >
              🚪 Çıkış Yap
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
                  <div 
                    key={cafe.id} 
                    onClick={() => navigate(`/admin/cafe/${cafe.id}`)}
                    className="relative bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-blue-500 hover:bg-slate-750 hover:shadow-blue-900/20 transition-all cursor-pointer group block"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                      {/* Düzenle Butonu */}
                      <button 
                        type="button"
                        onClick={(e) => openEditModal(cafe, e)}
                        className="text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 p-1.5 rounded-lg transition-colors"
                        title="Kafe ve Giriş Bilgilerini Düzenle"
                      >
                        ✏️
                      </button>
                      
                      {/* Sil Butonu */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); 
                          if (window.confirm(`"${cafe.name}" kafesini ve ilgili verileri silmek istediğinizden emin misiniz?`)) {
                            handleDeleteCafe(cafe.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-400 hover:bg-slate-700/60 p-1.5 rounded-lg transition-colors"
                        title="Kafeyi Sil"
                      >
                        🗑️
                      </button>
                    </div>

                    <h3 className="text-2xl font-bold mb-2 pr-16 text-white group-hover:text-blue-400 transition-colors">{cafe.name}</h3>
                    <div className="text-xs text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                      <div>Bağlantı: <span className="text-blue-400 font-mono">/{cafe.slug}</span></div>
                      <div>Kullanıcı Adı: <span className="text-amber-400 font-mono">{cafe.username || cafe.slug}</span></div>
                      {cafe.custom_domain && (
                        <div>Alan Adı: <span className="text-emerald-400 font-mono">{cafe.custom_domain}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal Katmanı (Z-INDEX: 1000) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm">
            <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {editingCafe ? `Kafe Düzenle: ${editingCafe.name}` : 'Yeni Kafe Oluştur'}
              </h2>
              
              <form onSubmit={handleSaveCafe} className="space-y-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-sm">Kafe Adı *</label>
                  <input 
                    type="text" 
                    required
                    value={cafeName}
                    onChange={handleCafeNameChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Örn: Lezzet Dünyası"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-sm">Sistem Linki / Slug *</label>
                  <input 
                    type="text" 
                    required
                    value={cafeSlug}
                    onChange={handleCafeSlugChange}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-emerald-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="lezzet-dunyasi"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-sm">Giriş Kullanıcı Adı (Username)</label>
                  <input 
                    type="text" 
                    value={cafeUsername}
                    onChange={(e) => setCafeUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-amber-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="lezzet-dunyasi"
                  />
                  <p className="text-xs text-slate-500 mt-1">Restoran sahibinin panele girerken kullanacağı kullanıcı adı.</p>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-sm">
                    Giriş Şifresi {editingCafe ? '(Opsiyonel)' : '*'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingCafe}
                    value={cafePassword}
                    onChange={(e) => setCafePassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={editingCafe ? "Boş bırakılırsa mevcut şifre değişmez" : "••••••••"}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium text-sm">Özel Alan Adı (Custom Domain - İsteğe Bağlı)</label>
                  <input 
                    type="text" 
                    value={cafeCustomDomain}
                    onChange={(e) => setCafeCustomDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Örn: altinbalik.com"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
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
                    {isSavingCafe ? 'Kaydediliyor...' : (editingCafe ? 'Güncelle' : 'Sisteme Kaydet')}
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