import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CafeDetail() {
  const { id } = useParams();

  // --- KATEGORİ STATE'LERİ ---
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  // --- ÜRÜN STATE'LERİ ---
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Ürün Form State'leri
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');

  // --- ÜRÜN DÜZENLEME STATE'LERİ ---
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductDescription, setEditProductDescription] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductImageUrl, setEditProductImageUrl] = useState('');

  // --- YENİ: TASARIM AYARLARI STATE VE FONKSİYONU ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cafeDetails, setCafeDetails] = useState(null);
  const [branding, setBranding] = useState({
    hero_image: '',
    primary_color: '#1A3626',
    accent_color: '#D4AF37',
    bg_color: '#F9F7F2',
    custom_domain: ''
  });

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

  const fetchCafeDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cafes/${id}`, {
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        const data = await response.json();
        setCafeDetails(data);
        setBranding({
          hero_image: data.hero_image || '',
          primary_color: data.primary_color || '#1A3626',
          accent_color: data.accent_color || '#D4AF37',
          bg_color: data.bg_color || '#F9F7F2',
          custom_domain: data.custom_domain || ''
        });
      }
    } catch (error) {
      console.error("Error fetching cafe details:", error);
    }
  };

  const handleUpdateBranding = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/cafes/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(branding),
      });
      
      if (handleAuthError(response)) return;

      if (response.ok) {
        const updatedCafe = await response.json();
        setCafeDetails(updatedCafe);
        alert("Görünüm ayarları başarıyla güncellendi!");
        setIsSettingsOpen(false);
      } else {
        const errorData = await response.json();
        alert("Kaydetme Başarısız! Hata: " + JSON.stringify(errorData));
        console.error("Backend Hatası:", errorData);
      }
    } catch (error) {
      alert("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
      console.error("Bağlantı Hatası:", error);
    }
  };
  // ----------------------------------------------------

  // Sayfa açıldığında kategorileri ve kafe detaylarını getir
  useEffect(() => {
    fetchCategories();
    fetchCafeDetails();
  }, [id]);

  // ---------------- KATEGORİ İŞLEMLERİ ----------------
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          cafe_id: parseInt(id),
          name: categoryName,
          order_index: parseInt(orderIndex)
        }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        fetchCategories(); 
        setCategoryName('');
        setOrderIndex(0);
        setIsCategoryModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // ---------------- ÜRÜN İŞLEMLERİ ----------------
  const openProductManager = async (category) => {
    setSelectedCategory(category);
    setIsProductModalOpen(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${category.id}`, {
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          category_id: selectedCategory.id,
          name: productName,
          description: productDescription,
          price: parseFloat(productPrice),
          image_url: productImageUrl,
          is_active: true
        }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([newProduct, ...products]); 
        
        setProductName('');
        setProductDescription('');
        setProductPrice('');
        setProductImageUrl('');
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        setProducts(products.filter(prod => prod.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleToggleProductStatus = async (productId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/toggle`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(prod => 
          prod.id === productId ? updatedProduct : prod
        ));
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
    }
  };

  const openProductEdit = (product) => {
    setSelectedProductToEdit(product);
    setEditProductName(product.name);
    setEditProductPrice(product.price);
    setEditProductDescription(product.description || '');
    setEditProductImageUrl(product.image_url || '');
    setIsEditProductModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProductToEdit.id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: editProductName,
          description: editProductDescription,
          price: parseFloat(editProductPrice),
          image_url: editProductImageUrl
        }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(prod => prod.id === selectedProductToEdit.id ? updatedProduct : prod));
        setIsEditProductModalOpen(false);
      } else {
        const errorData = await response.json();
        alert("Güncelleme Başarısız: " + errorData.error);
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Başlık ve Üst Menü */}
        <div className="mb-8">
          <Link to="/admin" className="text-sm text-blue-400 hover:underline">
            ← SaaS Kontrol Merkezine Dön
          </Link>
          <div className="flex justify-between items-center mt-4 border-b border-slate-700 pb-6">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
              Menü Yönetimi: {cafeDetails ? cafeDetails.name : `Yükleniyor (ID: ${id})`}
            </h1>
            <div className="flex gap-4">
              {/* Siteye Git Butonu */}
              {cafeDetails && (
                <a 
                  href={(() => {
                    const hostname = window.location.hostname;
                    if (cafeDetails.custom_domain && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                      return `http://${cafeDetails.custom_domain}`;
                    }
                    return `http://localhost:5174/${cafeDetails.slug}`;
                  })()}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold transition-all border border-blue-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40"
                >
                  🔗 Siteye Git
                </a>
              )}
              {/* Görünüm Özelleştirme Butonu */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-bold transition-all border border-slate-600 flex items-center gap-2 cursor-pointer"
              >
                🎨 Görünümü Özelleştir
              </button>
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/50 cursor-pointer"
              >
                + Yeni Kategori
              </button>
            </div>
          </div>
        </div>

        {/* Ana İçerik */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 animate-pulse">Kategoriler Yükleniyor...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center shadow-xl">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Henüz Kategori Bulunmuyor</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Menünüze ürün ekleyebilmek için önce bir kategori (Örn: Tatlılar, İçecekler) oluşturmalısınız.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <h2 className="text-xl font-bold text-slate-400 mb-2">Kategoriler</h2>
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center hover:border-slate-600 transition-colors group"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-200">{category.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Sıralama (Order Index): {category.order_index}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => openProductManager(category)}
                    className="text-sm bg-blue-900/50 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-full border border-blue-800 transition-all font-medium"
                  >
                    Ürünleri Yönet →
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                    title="Kategoriyi Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODALLAR (AÇILIR PENCERELER) BÖLÜMÜ --- */}

        {/* KATEGORİ EKLEME MODALI */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">Yeni Kategori Oluştur</h2>
              <form onSubmit={handleSaveCategory}>
                <div className="mb-4">
                  <label className="block text-slate-400 mb-2 font-medium">Kategori Adı</label>
                  <input 
                    type="text" 
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Örn: Tatlılar, Ana Yemekler"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-slate-400 mb-2 font-medium">Sıralama (Order Index)</label>
                  <input 
                    type="number" 
                    required
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-700">İptal</button>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg font-bold text-white">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ÜRÜN YÖNETİM MODALI */}
        {isProductModalOpen && selectedCategory && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-2xl font-bold text-white">
                  <span className="text-emerald-400">{selectedCategory.name}</span> - Ürün Yönetimi
                </h2>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold px-3"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <div className="w-full md:w-1/3 p-6 bg-slate-850 border-r border-slate-700 overflow-y-auto">
                  <h3 className="text-lg font-bold text-slate-300 mb-4">Hızlı Ürün Ekle</h3>
                  <form onSubmit={handleSaveProduct}>
                    <div className="mb-4">
                      <label className="block text-sm text-slate-400 mb-1">Ürün Adı</label>
                      <input type="text" required value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Örn: Fırın Sütlaç" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-slate-400 mb-1">Fiyat (TL)</label>
                      <input type="number" step="0.01" required value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="120.50" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-slate-400 mb-1">Açıklama (İsteğe Bağlı)</label>
                      <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" rows="2" placeholder="İçindekiler vb."></textarea>
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm text-slate-400 mb-1">Görsel Linki (İsteğe Bağlı)</label>
                      <input type="text" value={productImageUrl} onChange={(e) => setProductImageUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" placeholder="https://..." />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-white transition-colors">
                      Listeye Ekle
                    </button>
                  </form>
                </div>

                <div className="w-full md:w-2/3 p-6 bg-slate-900 overflow-y-auto">
                  <h3 className="text-lg font-bold text-slate-300 mb-4">Aktif Ürünler ({products.length})</h3>
                  
                  {products.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg">
                      <p className="text-slate-500">Bu kategoride henüz ürün yok.</p>
                      <p className="text-sm text-slate-600 mt-2">Soldaki formu kullanarak hemen ekleyin.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {products.map((product) => (
                        <div key={product.id} className={`flex justify-between items-center p-4 rounded-lg border transition-all ${product.is_active ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-red-900/50 opacity-75'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-700 rounded object-cover flex items-center justify-center text-xl overflow-hidden">
                              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : '🍽️'}
                            </div>
                            <div>
                              <h4 className={`font-bold ${product.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{product.name}</h4>
                              <p className="text-emerald-400 font-bold text-sm">{product.price} TL</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                              className={`text-xs px-3 py-1 rounded-full font-bold border ${product.is_active ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-800' : 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800'}`}
                            >
                              {product.is_active ? 'SATIŞTA' : 'TÜKENDİ'}
                            </button>
                            <button
                              onClick={() => openProductEdit(product)}
                              className="text-slate-400 hover:text-blue-400 p-2 cursor-pointer"
                              title="Düzenle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-slate-500 hover:text-red-500 p-2"
                              title="Sil"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASARIM AYARLARI MODALI (YENİ) */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">🎨 Renk & Görsel Ayarları</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
              </div>
              
              <form onSubmit={handleUpdateBranding}>
                <div className="mb-4">
                  <label className="block text-slate-400 mb-1 text-sm font-medium">Kapak Görseli URL (Hero Image)</label>
                  <input 
                    type="text" 
                    value={branding.hero_image}
                    onChange={(e) => setBranding({...branding, hero_image: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Sitenin en üstünde görünecek ana fotoğraf.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-slate-400 mb-1 text-sm font-medium">Ana Renk (Primary)</label>
                    <div className="flex gap-2 items-center bg-slate-900 border border-slate-600 rounded-lg p-2">
                      <input 
                        type="color" 
                        value={branding.primary_color}
                        onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                      />
                      <span className="text-sm text-white font-mono">{branding.primary_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-sm font-medium">Vurgu Rengi (Accent)</label>
                    <div className="flex gap-2 items-center bg-slate-900 border border-slate-600 rounded-lg p-2">
                      <input 
                        type="color" 
                        value={branding.accent_color}
                        onChange={(e) => setBranding({...branding, accent_color: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                      />
                      <span className="text-sm text-white font-mono">{branding.accent_color}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-slate-400 mb-1 text-sm font-medium">Arka Plan Rengi (Background)</label>
                  <div className="flex gap-2 items-center bg-slate-900 border border-slate-600 rounded-lg p-2">
                    <input 
                      type="color" 
                      value={branding.bg_color}
                      onChange={(e) => setBranding({...branding, bg_color: e.target.value})}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-sm text-white font-mono">{branding.bg_color}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-slate-400 mb-1 text-sm font-medium">Özel Alan Adı (Custom Domain)</label>
                  <input 
                    type="text" 
                    value={branding.custom_domain}
                    onChange={(e) => setBranding({...branding, custom_domain: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm"
                    placeholder="Örn: altinbalik.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">Kafenin kendi özel alan adı (White-label).</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-700">İptal</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-bold text-white shadow-lg shadow-blue-900/50">Ayarları Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ÜRÜN DÜZENLEME MODALI */}
        {isEditProductModalOpen && selectedProductToEdit && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Ürünü Düzenle</h2>
                <button onClick={() => setIsEditProductModalOpen(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
              </div>

              <form onSubmit={handleUpdateProduct}>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Ürün Adı</label>
                  <input 
                    type="text" 
                    required 
                    value={editProductName} 
                    onChange={(e) => setEditProductName(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Fiyat (TL)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editProductPrice} 
                    onChange={(e) => setEditProductPrice(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Açıklama</label>
                  <textarea 
                    value={editProductDescription} 
                    onChange={(e) => setEditProductDescription(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm focus:outline-none focus:border-blue-500" 
                    rows="3"
                  ></textarea>
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Görsel Linki</label>
                  <input 
                    type="text" 
                    value={editProductImageUrl} 
                    onChange={(e) => setEditProductImageUrl(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm focus:outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-700">İptal</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-bold text-white shadow-lg shadow-blue-900/50">Güncelle</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}