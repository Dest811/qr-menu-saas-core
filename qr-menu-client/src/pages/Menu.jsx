import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ImageWithSkeleton from '../components/ImageWithSkeleton';

const API_BASE_URL = 'https://qr-menu-saas-core.onrender.com';

export default function Menu() {
  const { slug } = useParams();

  const [cafe, setCafe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');

  // YENİ: Detay modalını ve Dil Dropdown'unu kontrol edecek state'ler
  const [selectedProductDetail, setSelectedProductDetail] = useState(null); // Hangi ürünün detayı açık?
  const [lang, setLang] = useState('tr'); // Dil Seçimi (tr, en, es, ar)
  const [isLangOpen, setIsLangOpen] = useState(false); // Dropdown açık/kapalı state

  const categoryRefs = useRef({});
  const categoryBtnRefs = useRef({});
  const isManualScroll = useRef(false);
  const langDropdownRef = useRef(null);

  // DROPDOWN CLICK OUTSIDE: Menü dışına tıklandığında dili kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchCafeData();
  }, [slug]);

  useEffect(() => {
    if (cafe) {
      document.title = `${cafe.name} | Dijital Menü`;
    }
  }, [cafe]);

  // SCROLL SPY: Kullanıcı sayfayı kaydırdıkça ekrandaki kategoriyi tespit et
  useEffect(() => {
    if (isLoading || !categories || categories.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -55% 0px',
    };

    const handleIntersect = (entries) => {
      if (isManualScroll.current) return;

      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (intersecting.length > 0) {
        // Ekranın üst hizasına en yakın görünür kategoriyi seç
        intersecting.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        const catId = intersecting[0].target.getAttribute('data-category-id');
        if (catId) {
          setActiveCategory(catId);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // DOM çizimi tamamlandıktan sonra kategorileri izlemeye al
    const timeoutId = setTimeout(() => {
      categories.forEach((cat) => {
        const el = document.getElementById(`category-${cat.id}`) || categoryRefs.current[cat.id];
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [categories, productsByCategory, isLoading]);

  // AUTO-SCROLL CATEGORY BAR: Seçili kategori değiştiğinde üst menü butonunu merkeze kaydır
  useEffect(() => {
    if (!activeCategory) return;
    const activeBtn = categoryBtnRefs.current[activeCategory];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCategory]);

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
        // Standart slug üzerinden kafeyi getir
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
    isManualScroll.current = true;
    setActiveCategory(categoryId);

    const targetElement = document.getElementById(`category-${categoryId}`) || categoryRefs.current[categoryId];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      isManualScroll.current = false;
    }, 1000);
  };

  // Dinamik olarak aktif dilleri belirle
  const availableLanguages = [
    { code: 'tr', label: 'TR', fullName: 'Türkçe (TR)' },
    ...(cafe?.has_english || cafe?.isEnglishActive ? [{ code: 'en', label: 'EN', fullName: 'English (EN)' }] : []),
    ...(cafe?.has_spanish || cafe?.isSpanishActive ? [{ code: 'es', label: 'ES', fullName: 'Español (ES)' }] : []),
    ...(cafe?.has_arabic || cafe?.isArabicActive ? [{ code: 'ar', label: 'AR', fullName: 'العربية (AR)' }] : []),
    ...(cafe?.has_french || cafe?.isFrenchActive ? [{ code: 'fr', label: 'FR', fullName: 'Français (FR)' }] : []),
    ...(cafe?.has_portuguese || cafe?.isPortugueseActive ? [{ code: 'pt', label: 'PT', fullName: 'Português (PT)' }] : []),
    ...(cafe?.has_russian || cafe?.isRussianActive ? [{ code: 'ru', label: 'RU', fullName: 'Русский (RU)' }] : []),
    ...(cafe?.has_german || cafe?.isGermanActive ? [{ code: 'de', label: 'DE', fullName: 'Deutsch (DE)' }] : []),
    ...(cafe?.has_persian || cafe?.isPersianActive ? [{ code: 'fa', label: 'FA', fullName: 'فارسی (FA)' }] : []),
  ];

  // Çoklu dil metin yardımcıları
  const getCategoryName = (category) => {
    if (!category) return '';
    if (lang === 'en' && category.name_en) return category.name_en;
    if (lang === 'es' && category.name_es) return category.name_es;
    if (lang === 'ar' && category.name_ar) return category.name_ar;
    if (lang === 'fr' && category.name_fr) return category.name_fr;
    if (lang === 'pt' && category.name_pt) return category.name_pt;
    if (lang === 'ru' && category.name_ru) return category.name_ru;
    if (lang === 'de' && category.name_de) return category.name_de;
    if (lang === 'fa' && category.name_fa) return category.name_fa;
    return category.name;
  };

  const getProductName = (product) => {
    if (!product) return '';
    if (lang === 'en' && product.name_en) return product.name_en;
    if (lang === 'es' && product.name_es) return product.name_es;
    if (lang === 'ar' && product.name_ar) return product.name_ar;
    if (lang === 'fr' && product.name_fr) return product.name_fr;
    if (lang === 'pt' && product.name_pt) return product.name_pt;
    if (lang === 'ru' && product.name_ru) return product.name_ru;
    if (lang === 'de' && product.name_de) return product.name_de;
    if (lang === 'fa' && product.name_fa) return product.name_fa;
    return product.name;
  };

  const getProductDesc = (product) => {
    if (!product) return '';
    if (lang === 'en' && product.description_en) return product.description_en;
    if (lang === 'es' && product.description_es) return product.description_es;
    if (lang === 'ar' && product.description_ar) return product.description_ar;
    if (lang === 'fr' && product.description_fr) return product.description_fr;
    if (lang === 'pt' && product.description_pt) return product.description_pt;
    if (lang === 'ru' && product.description_ru) return product.description_ru;
    if (lang === 'de' && product.description_de) return product.description_de;
    if (lang === 'fa' && product.description_fa) return product.description_fa;
    return product.description;
  };

  const getCampaignText = () => {
    if (!cafe) return '';
    if (lang === 'en' && cafe.campaign_text_en) return cafe.campaign_text_en;
    if (lang === 'es' && cafe.campaign_text_es) return cafe.campaign_text_es;
    if (lang === 'ar' && cafe.campaign_text_ar) return cafe.campaign_text_ar;
    if (lang === 'fr' && cafe.campaign_text_fr) return cafe.campaign_text_fr;
    if (lang === 'pt' && cafe.campaign_text_pt) return cafe.campaign_text_pt;
    if (lang === 'ru' && cafe.campaign_text_ru) return cafe.campaign_text_ru;
    if (lang === 'de' && cafe.campaign_text_de) return cafe.campaign_text_de;
    if (lang === 'fa' && cafe.campaign_text_fa) return cafe.campaign_text_fa;
    return cafe.campaign_text;
  };

  const uiTranslations = {
    tr: {
      getDirections: 'Yol Tarifi Al',
      digitalMenu: 'Dijital Menü',
      menuSoon: 'Menü çok yakında eklenecektir.',
      noProducts: 'Bu kategoride henüz ürün yok.',
      soldOut: 'TÜKENDİ',
      workingHours: 'Çalışma Saatleri:',
      contact: 'İletişim:'
    },
    en: {
      getDirections: 'Get Directions',
      digitalMenu: 'Digital Menu',
      menuSoon: 'The menu will be available soon.',
      noProducts: 'No products in this category yet.',
      soldOut: 'SOLD OUT',
      workingHours: 'Working Hours:',
      contact: 'Contact:'
    },
    es: {
      getDirections: 'Obtener Indicaciones',
      digitalMenu: 'Menú Digital',
      menuSoon: 'El menú estará disponible pronto.',
      noProducts: 'Aún no hay productos en esta categoría.',
      soldOut: 'AGOTADO',
      workingHours: 'Horas de Trabajo:',
      contact: 'Contacto:'
    },
    ar: {
      getDirections: 'احصل على الاتجاهات',
      digitalMenu: 'قائمة طعام رقمية',
      menuSoon: 'ستتوفر القائمة قريبًا.',
      noProducts: 'لا توجد منتجات في هذه الفئة بعد.',
      soldOut: 'نفدت الكمية',
      workingHours: 'ساعات العمل:',
      contact: 'اتصال:'
    },
    fr: {
      getDirections: 'Obtenir Itinéraire',
      digitalMenu: 'Menu Numérique',
      menuSoon: 'Le menu sera bientôt disponible.',
      noProducts: 'Aucun produit dans cette catégorie.',
      soldOut: 'ÉPUISÉ',
      workingHours: 'Heures d\'ouverture:',
      contact: 'Contact:'
    },
    pt: {
      getDirections: 'Obter Direções',
      digitalMenu: 'Menu Digital',
      menuSoon: 'O menu estará disponível em breve.',
      noProducts: 'Nenhum produto nesta categoria.',
      soldOut: 'ESGOTADO',
      workingHours: 'Horário de Funcionamento:',
      contact: 'Contato:'
    },
    ru: {
      getDirections: 'Маршрут',
      digitalMenu: 'Цифровое Меню',
      menuSoon: 'Меню скоро будет доступно.',
      noProducts: 'В этой категории пока нет товаров.',
      soldOut: 'РАСПОДАН',
      workingHours: 'Часы работы:',
      contact: 'Контакты:'
    },
    de: {
      getDirections: 'Route Anzeigen',
      digitalMenu: 'Digitales Menü',
      menuSoon: 'Das Menü ist bald verfügbar.',
      noProducts: 'Noch keine Produkte in dieser Kategorie.',
      soldOut: 'AUSVERKAUFT',
      workingHours: 'Öffnungszeiten:',
      contact: 'Kontakt:'
    },
    fa: {
      getDirections: 'مسیریابی',
      digitalMenu: 'منوی دیجیتال',
      menuSoon: 'منو به‌زودی در دسترس خواهد بود.',
      noProducts: 'هنوز محصولی در این دسته‌بندی وجود ندارد.',
      soldOut: 'تمام شد',
      workingHours: 'ساعات کاری:',
      contact: 'تماس:'
    }
  };
  const t = uiTranslations[lang] || uiTranslations.tr;

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
    <div 
      className="min-h-screen font-sans pb-24 transition-colors duration-500 animate-fade-in" 
      style={{ backgroundColor: bgColor }}
      dir={lang === 'ar' || lang === 'fa' ? 'rtl' : 'ltr'}
    >
      
      {/* HERO SECTION */}
      <header className="relative pt-24 pb-20 px-6 text-center overflow-hidden shadow-lg">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${coverImage}')` }}
        ></div>
        <div className="absolute inset-0 opacity-75 mix-blend-multiply transition-colors duration-500" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        {/* Yol Tarifi Al (Sol Üst Köşeye Sabitlenmiş Şık Kapsül) */}
        {cafe.maps_url && cafe.maps_url.trim() !== '' && (
          <a 
            href={cafe.maps_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-white bg-black/50 backdrop-blur-md py-2 px-3.5 rounded-full hover:bg-black/70 transition-all font-semibold shadow-md border border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t.getDirections}</span>
          </a>
        )}
        
        {/* Dil Değiştirme Dropdown Menüsü (Sağ Üst Köşede Açılır Menü) */}
        {cafe && availableLanguages.length > 1 && (
          <div className="absolute top-4 right-4 z-[9999]" ref={langDropdownRef}>
            <button 
              type="button"
              onClick={() => setIsLangOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-xs text-white bg-black/60 backdrop-blur-md py-2 px-3.5 rounded-full hover:bg-black/80 transition-all font-semibold shadow-lg border border-white/15 cursor-pointer select-none active:scale-95"
              aria-expanded={isLangOpen}
              aria-haspopup="true"
            >
              <span className="tracking-wider uppercase font-bold">{lang}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-3.5 w-3.5 text-white/80 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Açılır Menü (Floating Overlay - Tam Boyut & Scrollbar'sız Dropdown List) */}
            <div 
              className={`absolute right-0 mt-2 w-48 h-auto bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl py-1.5 transition-all duration-200 ease-out origin-top-right z-[9999] ${
                isLangOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
            >
              {availableLanguages.map((l) => {
                const isSelected = lang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-white/20 text-white font-bold' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                  >
                    <span>{l.fullName}</span>
                    {isSelected && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="relative z-10 max-w-lg mx-auto">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3 font-serif drop-shadow-md">
            {cafe.name}
          </h1>
          <p className="text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-2 drop-shadow-sm transition-colors duration-500" style={{ color: accentColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></span>
            {t.digitalMenu}
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
            {categories.map(category => {
              const isActive = String(activeCategory) === String(category.id);
              return (
                <button
                  key={category.id}
                  ref={el => categoryBtnRefs.current[category.id] = el}
                  onClick={() => scrollToCategory(category.id)}
                  style={{
                    backgroundColor: isActive ? primaryColor : 'transparent',
                    color: isActive ? '#ffffff' : primaryColor,
                    borderColor: isActive ? primaryColor : `${primaryColor}40`
                  }}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold border transition-all duration-300 shadow-sm cursor-pointer ${
                    isActive ? 'shadow-md scale-105' : 'hover:opacity-80'
                  }`}
                >
                  {getCategoryName(category)}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* KAMPANYA FIRSAT KARTI */}
      {cafe && cafe.campaign_text && cafe.campaign_text.trim() !== '' && (
        <div className="max-w-xl mx-auto px-5 mt-6">
          <div 
            className="backdrop-blur-md border shadow-sm rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-500"
            style={{ 
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}30`,
            }}
          >
            <div className="shrink-0 flex items-center justify-center animate-pulse" style={{ color: primaryColor }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold leading-relaxed" style={{ color: primaryColor }}>
                {getCampaignText()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MENÜ İÇERİĞİ */}
      <main className="max-w-xl mx-auto p-5 mt-4 space-y-12">
        {categories.length === 0 ? (
          <p className="text-center text-slate-400 mt-10 text-sm">{t.menuSoon}</p>
        ) : (
          categories.map(category => (
            <section 
              key={category.id} 
              id={`category-${category.id}`}
              data-category-id={category.id}
              ref={el => categoryRefs.current[category.id] = el}
              className="scroll-mt-36 animate-fade-in-up"
            >
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold font-serif pr-4 transition-colors duration-500" style={{ color: primaryColor }}>
                  {getCategoryName(category)}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-300 to-transparent"></div>
              </div>
              
              {/* ÜRÜN KARTLARI */}
              <div className="space-y-4">
                {productsByCategory[category.id]?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">{t.noProducts}</p>
                ) : (
                  productsByCategory[category.id]?.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => product.is_active && setSelectedProductDetail(product)}
                      className={`group bg-white rounded-3xl p-3 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] cursor-pointer ${!product.is_active && 'opacity-60 grayscale'}`}
                    >
                      <div className="flex-1 flex flex-col justify-center py-2 pl-2">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className={`font-bold text-[17px] leading-tight ${!product.is_active ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                             {getProductName(product)}
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
                              {t.soldOut}
                            </span>
                          )}
                        </div>
                         {getProductDesc(product) && (
                          <p className="text-[13px] text-slate-500 leading-snug line-clamp-2 mt-1 pr-2">
                            {getProductDesc(product)}
                          </p>
                        )}
                      </div>

                      <div className="w-24 h-24 shrink-0 bg-slate-50 rounded-2xl overflow-hidden shadow-inner relative border border-slate-100 flex items-center justify-center text-3xl">
                        {product.image_url ? (
                          <ImageWithSkeleton 
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

      {/* FOOTER ALANI */}
      {((cafe.working_hours && cafe.working_hours.trim() !== '') || 
        (cafe.phone_number && cafe.phone_number.trim() !== '') || 
        (cafe.instagram_url && cafe.instagram_url.trim() !== '')) && (
        <footer 
          className="w-full border-t border-slate-200 mt-12 py-8 flex flex-col items-center gap-4 text-center px-6"
          style={{ borderColor: `${primaryColor}15` }}
        >
          {cafe.working_hours && cafe.working_hours.trim() !== '' && (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <span className="text-base select-none">🕒</span>
              <span>{t.workingHours} {cafe.working_hours}</span>
            </div>
          )}

          {cafe.phone_number && cafe.phone_number.trim() !== '' && (
            <a 
              href={`tel:${cafe.phone_number.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-slate-600 hover:opacity-80 transition-opacity text-sm font-medium"
              style={{ color: primaryColor }}
            >
              <span className="text-base select-none">📞</span>
              <span>{t.contact} {cafe.phone_number}</span>
            </a>
          )}

          {cafe.instagram_url && cafe.instagram_url.trim() !== '' && (
            <a 
              href={cafe.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-85 transition-opacity text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ stroke: primaryColor }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                <path strokeWidth={2} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={3} strokeLinecap="round" />
              </svg>
              <span>Instagram</span>
            </a>
          )}
        </footer>
      )}

      {/* ÜRÜN DETAY MODALI */}
      {selectedProductDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity duration-300 ease-out"
          style={{ opacity: selectedProductDetail ? 1 : 0 }}
          onClick={() => setSelectedProductDetail(null)}
        >
          <div 
            className="animate-scale-in bg-slate-950 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-800 transition-all duration-300 ease-out"
            style={{ 
              backgroundColor: `${primaryColor}CC`,
              backdropFilter: 'blur(15px)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProductDetail.image_url ? (
              <div className="w-full h-72 relative overflow-hidden">
                <ImageWithSkeleton
                  src={selectedProductDetail.image_url}
                  alt={selectedProductDetail.name}
                  className="w-full h-72 object-cover"
                />
                <button 
                  onClick={() => setSelectedProductDetail(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center text-xl font-bold backdrop-blur-sm transition-all hover:bg-black/70 z-20"
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

            <div className="p-8 text-white">
              <div className="flex justify-between items-start mb-6 gap-3">
                <h1 
                  className="text-2xl font-bold leading-tight tracking-tight break-words" 
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                   {getProductName(selectedProductDetail)}
                </h1>
                
                <p className="text-2xl font-black shrink-0 drop-shadow-md" style={{ color: accentColor }}>
                  {selectedProductDetail.price} TL
                </p>
              </div>
              
              {getProductDesc(selectedProductDetail) && (
                <div className="border-t border-white/20 pt-5 mt-2">
                  <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {getProductDesc(selectedProductDetail)}
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