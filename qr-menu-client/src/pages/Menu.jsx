import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = 'https://qr-menu-saas-core.onrender.com';

export default function Menu() {
  const { slug } = useParams();

  const [cafe, setCafe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');

  // YENİ: Detay modalını kontrol edecek state'ler
  const [selectedProductDetail, setSelectedProductDetail] = useState(null); // Hangi ürünün detayı açık?

  const categoryRefs = useRef({});

  useEffect(() => {
    fetchCafeData();
  }, [slug]);

  useEffect(() => {
    if (cafe) {
      document.title = `${cafe.name} | Dijital Menü`;
    }
  }, [cafe]);

  const fetchCafeData = async () => {
    try {
      const hostname = window.location.hostname;
      const baseDomains = ['localhost', '127.0.0.1', 'benimsistemim.com', 'qr-menu-saas.com'];
      const isCustomDomain = !baseDomains.includes(hostname) && !hostname.endsWith('.benimsistemim.com');

      let currentCafe = null;

      if (isCustomDomain) {
        // Kendi alan adını (custom domain) kullanan kafeyi getir
        const cafeRes = await fetch(`${API_BASE_URL}/api/cafes/domain/${hostname}`);
        if (!cafeRes.ok) {
          setError("Bu alan adına ait bir kafe bulunamadı.");
          setIsLoading(false);
          return;
        }
        currentCafe = await cafeRes.json();
      } else {
        // Standart slug üzerinden kafeyi getir (Tüm kafeleri indirip filtreleme sorunu çözüldü!)
        if (!slug) {
          setError("Lütfen geçerli bir kafe adresi giriniz.");
          setIsLoading(false);
          return;
        }
        const cafeRes = await fetch(`${API_BASE_URL}/api/cafes/slug/${slug}`);
        if (!cafeRes.ok) {
          setError("Böyle bir kafe bulunamadı.");
          setIsLoading(false);
          return;
        }
        currentCafe = await cafeRes.json();
      }
      
      setCafe(currentCafe);

      const catRes = await fetch(`${API_BASE_URL}/api/categories/${currentCafe.id}`);
      const catData = await catRes.json();
      setCategories(catData);
      
      if (catData.length > 0) {
        setActiveCategory(catData[0].id);
      }

      const productsMap = {};
      for (const category of catData) {
        const prodRes = await fetch(`${API_BASE_URL}/api/products/${category.id}`);
        const prodData = await prodRes.json();
        productsMap[category.id] = prodData;
      }
      setProductsByCategory(productsMap);

    } catch (err) {
      console.error(err);
      setError("Bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="w-10 h-10 border-[3px] border-slate-800 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="tracking-widest uppercase text-xs font-semibold animate-pulse">Menü Hazırlanıyor</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center animate-fade-in" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="bg-white p-10 rounded-3xl shadow-sm border">
          <h1 className="text-xl font-bold mb-2">Erişim Hatası</h1>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Branding renkleri
  const primaryColor = cafe.primary_color || '#1A3626';
  const accentColor = cafe.accent_color || '#D4AF37';
  const bgColor = cafe.bg_color || '#F9F7F2';
  const coverImage = cafe.hero_image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1920&auto=format&fit=crop';

  return (
    <div className="min-h-screen font-sans pb-24 transition-colors duration-500 animate-fade-in" style={{ backgroundColor: bgColor }}>
      
      {/* HERO SECTION */}
      <header className="relative pt-24 pb-20 px-6 text-center overflow-hidden shadow-lg">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${coverImage}')` }}
        ></div>
        <div className="absolute inset-0 opacity-75 mix-blend-multiply transition-colors duration-500" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        <div className="relative z-10 max-w-lg mx-auto">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3 font-serif drop-shadow-md">
            {cafe.name}
          </h1>
          <p className="text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-2 drop-shadow-sm transition-colors duration-500" style={{ color: accentColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
            Dijital Menü
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
          </p>
        </div>
      </header>

      {/* STICKY KATEGORİ BAR */}
      <nav 
        className="sticky top-0 z-40 backdrop-blur-md border-b shadow-sm transition-all duration-500" 
        style={{ backgroundColor: `${bgColor}E6`, borderColor: `${primaryColor}20` }}
      >
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                style={{
                  backgroundColor: activeCategory === category.id ? primaryColor : 'transparent',
                  color: activeCategory === category.id ? '#ffffff' : '#555555',
                  borderColor: activeCategory === category.id ? primaryColor : `${primaryColor}40`
                }}
                className="whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-300 shadow-sm"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* MENÜ İÇERİĞİ */}
      <main className="max-w-xl mx-auto p-5 mt-4 space-y-12">
        {categories.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-sm">Menü çok yakında eklenecektir.</p>
        ) : (
          categories.map(category => (
            <section 
              key={category.id} 
              ref={el => categoryRefs.current[category.id] = el}
              className="scroll-mt-32 animate-fade-in-up"
            >
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold font-serif pr-4 transition-colors duration-500" style={{ color: primaryColor }}>
                  {category.name}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-300 to-transparent"></div>
              </div>
              
              {/* ÜRÜN KARTLARI */}
              <div className="space-y-4">
                {productsByCategory[category.id]?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Bu kategoride henüz ürün yok.</p>
                ) : (
                  productsByCategory[category.id]?.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => product.is_active && setSelectedProductDetail(product)} // YENİ: Ürün tıklandığında detay modalını aç
                      className={`group bg-white rounded-3xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] cursor-pointer ${!product.is_active && 'opacity-60 grayscale'}`}
                    >
                      <div className="flex-1 flex flex-col justify-center py-2 pl-2">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className={`font-bold text-[17px] leading-tight ${!product.is_active ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {product.name}
                          </h3>
                          {product.is_active ? (
                            <span 
                              className="font-bold px-3 py-1 rounded-xl text-sm shrink-0 border transition-all duration-500"
                              style={{ color: primaryColor, backgroundColor: `${bgColor}80`, borderColor: `${primaryColor}20` }}
                            >
                              {product.price} ₺
                            </span>
                          ) : (
                            <span className="font-bold text-red-700 bg-red-50 px-2 py-1 rounded-xl text-xs shrink-0 border border-red-100">
                              TÜKENDİ
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-[13px] text-slate-500 leading-snug line-clamp-2 mt-1 pr-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="w-24 h-24 shrink-0 bg-slate-50 rounded-2xl overflow-hidden shadow-inner relative border border-slate-100 flex items-center justify-center text-3xl">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        ) : (
                          <span className="opacity-40 select-none">🍽️</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </main>

{/* --- YENİ: TASARIMLI VE ANİMASYONLU ÜRÜN DETAY MODALI --- */}
      {selectedProductDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity duration-300 ease-out"
          style={{ opacity: selectedProductDetail ? 1 : 0 }}
          onClick={() => setSelectedProductDetail(null)} // Arka plana tıklandığında kapat
        >
          {/* Modal Kartı (Özel Animasyon Sınıfı: animate-scale-in) */}
          <div 
            className="animate-scale-in bg-slate-950 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-800 transition-all duration-300 ease-out"
            style={{ 
              backgroundColor: `${primaryColor}CC`, // Ana renkle transparan Glass efekti
              backdropFilter: 'blur(15px)' 
            }}
            onClick={(e) => e.stopPropagation()} // Kartın içine tıklandığında kapatmayı engelle
          >
            {/* Büyük Ürün Görseli */}
            {selectedProductDetail.image_url ? (
              <div className="w-full h-72 relative bg-cover bg-center" style={{ backgroundImage: `url('${selectedProductDetail.image_url}')` }}>
                {/* Kapatma Butonu (X) */}
                <button 
                  onClick={() => setSelectedProductDetail(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all hover:bg-black/70"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="w-full h-40 relative flex items-center justify-center text-5xl bg-slate-800" style={{ color: `${primaryColor}40` }}>
                🍽️
                 <button 
                  onClick={() => setSelectedProductDetail(null)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-3xl font-bold px-3 py-1 rounded"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Ürün Detay Metinleri */}
            <div className="p-8 text-white">
              <div className="flex justify-between items-start mb-6 gap-3">
                
               {/* DAHA KÜÇÜK VE ZARİF BAŞLIK */}
                <h1 
                  className="text-2xl font-bold leading-tight tracking-tight break-words" 
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {selectedProductDetail.name}
                </h1>
                
                <p className="text-2xl font-black shrink-0 drop-shadow-md" style={{ color: accentColor }}>
                  {selectedProductDetail.price} TL
                </p>
              </div>
              
              {/* SADECE SENİN GİRDİĞİN AÇIKLAMA (Esnek ve Dinamik) */}
              {selectedProductDetail.description && (
                <div className="border-t border-white/20 pt-5 mt-2">
                  <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {selectedProductDetail.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}