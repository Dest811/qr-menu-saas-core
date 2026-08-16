import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { getAuthUser, logout } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://qr-menu-saas-core.onrender.com');

// Desteklenen Diller Konfigürasyonu (Gelecekte yeni bir dil eklendiğinde sadece buraya 1 nesne eklenir)
const SUPPORTED_LANGUAGES = [
  { code: 'tr', key: '', apiKey: 'isTurkishActive', settingKey: 'has_turkish', name: 'Türkçe', isDefault: true, placeholder: 'Örn: Fırın Sütlaç', descPlaceholder: 'İçindekiler vb.' },
  { code: 'en', key: '_en', apiKey: 'isEnglishActive', settingKey: 'has_english', name: 'İngilizce', placeholder: 'Örn: Oven Baked Rice Pudding', descPlaceholder: 'Ingredients etc.' },
  { code: 'es', key: '_es', apiKey: 'isSpanishActive', settingKey: 'has_spanish', name: 'İspanyolca', placeholder: 'Örn: Arroz con leche al horno', descPlaceholder: 'Ingredientes etc.' },
  { code: 'ar', key: '_ar', apiKey: 'isArabicActive', settingKey: 'has_arabic', name: 'Arapça', placeholder: 'Örn: أرز بالحليب في الفرن', descPlaceholder: 'المكونات وما إلى ذلك', dir: 'rtl' },
  { code: 'fr', key: '_fr', apiKey: 'isFrenchActive', settingKey: 'has_french', name: 'Fransızca (FR)', placeholder: 'Örn: Riz au lait au four', descPlaceholder: 'Ingrédients etc.' },
  { code: 'pt', key: '_pt', apiKey: 'isPortugueseActive', settingKey: 'has_portuguese', name: 'Portekizce (PT)', placeholder: 'Örn: Arroz doce no forno', descPlaceholder: 'Ingredientes etc.' },
  { code: 'ru', key: '_ru', apiKey: 'isRussianActive', settingKey: 'has_russian', name: 'Rusça (RU)', placeholder: 'Örn: Запеченный рисовый пудинг', descPlaceholder: 'Ингредиенты и т.д.' },
  { code: 'de', key: '_de', apiKey: 'isGermanActive', settingKey: 'has_german', name: 'Almanca (DE)', placeholder: 'Örn: Ofen-Milchreis', descPlaceholder: 'Zutaten usw.' },
  { code: 'fa', key: '_fa', apiKey: 'isPersianActive', settingKey: 'has_persian', name: 'Farsça (FA)', placeholder: 'Örn: شیربرنج قالبی', descPlaceholder: 'ترکیبات و غیره', dir: 'rtl' },
];

export default function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const isCafeOwner = authUser && authUser.role === 'cafe_owner';

  // --- BİLDİRİM / TOAST STATE'İ (Z-INDEX 9999) ---
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Kafe Sahibi ise ve başkasının kafe ID'sine girmeye çalışıyorsa kendi kafesine yönlendir
  useEffect(() => {
    if (isCafeOwner && authUser.cafeId && String(id) !== String(authUser.cafeId)) {
      navigate(`/admin/cafe/${authUser.cafeId}`, { replace: true });
    }
  }, [id, isCafeOwner, authUser, navigate]);

  // --- KATEGORİ STATE'LERİ ---
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  
  const initialCategoryFormData = {
    name: '',
    name_en: '',
    name_es: '',
    name_ar: '',
    name_fr: '',
    name_pt: '',
    name_ru: '',
    name_de: '',
    name_fa: '',
    order_index: 0
  };
  const [categoryFormData, setCategoryFormData] = useState(initialCategoryFormData);

  // --- ÜRÜN STATE'LERİ (Dinamik ve Ölçeklenebilir) ---
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const initialProductFormData = {
    name: '',
    name_en: '',
    name_es: '',
    name_ar: '',
    name_fr: '',
    name_pt: '',
    name_ru: '',
    name_de: '',
    name_fa: '',
    price: '',
    description: '',
    description_en: '',
    description_es: '',
    description_ar: '',
    description_fr: '',
    description_pt: '',
    description_ru: '',
    description_de: '',
    description_fa: '',
    image_url: '',
  };
  const [productFormData, setProductFormData] = useState(initialProductFormData);

  const handleProductFormChange = (key, value) => {
    setProductFormData(prev => ({ ...prev, [key]: value }));
  };

  const [isAddUploading, setIsAddUploading] = useState(false);

  // --- ÜRÜN DÜZENLEME STATE'LERİ (Dinamik ve Ölçeklenebilir) ---
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState(null);

  const initialEditFormData = {
    name: '',
    name_en: '',
    name_es: '',
    name_ar: '',
    name_fr: '',
    name_pt: '',
    name_ru: '',
    name_de: '',
    name_fa: '',
    price: '',
    description: '',
    description_en: '',
    description_es: '',
    description_ar: '',
    description_fr: '',
    description_pt: '',
    description_ru: '',
    description_de: '',
    description_fa: '',
    image_url: '',
  };
  const [editProductFormData, setEditProductFormData] = useState(initialEditFormData);

  const handleEditProductFormChange = (key, value) => {
    setEditProductFormData(prev => ({ ...prev, [key]: value }));
  };

  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);

  // --- YENİ: TASARIM AYARLARI STATE VE FONKSİYONU ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cafeDetails, setCafeDetails] = useState(null);
  const [branding, setBranding] = useState({
    hero_image: '',
    coverImage: '',
    primary_color: '#1A3626',
    accent_color: '#D4AF37',
    bg_color: '#F9F7F2',
    custom_domain: '',
    working_hours: '',
    maps_url: '',
    instagram_url: '',
    phone_number: '',
    has_english: false,
    has_spanish: false,
    has_arabic: false,
    isFrenchActive: false,
    has_french: false,
    isPortugueseActive: false,
    has_portuguese: false,
    isRussianActive: false,
    has_russian: false,
    isGermanActive: false,
    has_german: false,
    isPersianActive: false,
    has_persian: false,
    campaign_text: '',
    campaign_text_en: '',
    campaign_text_es: '',
    campaign_text_ar: '',
    campaign_text_fr: '',
    campaign_text_pt: '',
    campaign_text_ru: '',
    campaign_text_de: '',
    campaign_text_fa: ''
  });
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);

  // Dinamik Aktif Diller Dizisi (Türkçe sabit, diğerleri ayarlara bağlı)
  const activeLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) => lang.isDefault || (cafeDetails && (cafeDetails[lang.apiKey] || cafeDetails[lang.settingKey]))
  );

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
      navigate('/login', { replace: true });
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
          coverImage: data.coverImage || '',
          primary_color: data.primary_color || '#1A3626',
          accent_color: data.accent_color || '#D4AF37',
          bg_color: data.bg_color || '#F9F7F2',
          custom_domain: data.custom_domain || '',
          working_hours: data.working_hours || '',
          maps_url: data.maps_url || '',
          instagram_url: data.instagram_url || '',
          phone_number: data.phone_number || '',
          has_english: data.has_english || false,
          has_spanish: data.has_spanish || false,
          has_arabic: data.has_arabic || false,
          isFrenchActive: data.isFrenchActive || data.has_french || false,
          has_french: data.has_french || data.isFrenchActive || false,
          isPortugueseActive: data.isPortugueseActive || data.has_portuguese || false,
          has_portuguese: data.has_portuguese || data.isPortugueseActive || false,
          isRussianActive: data.isRussianActive || data.has_russian || false,
          has_russian: data.has_russian || data.isRussianActive || false,
          isGermanActive: data.isGermanActive || data.has_german || false,
          has_german: data.has_german || data.isGermanActive || false,
          isPersianActive: data.isPersianActive || data.has_persian || false,
          has_persian: data.has_persian || data.isPersianActive || false,
          campaign_text: data.campaign_text || '',
          campaign_text_en: data.campaign_text_en || '',
          campaign_text_es: data.campaign_text_es || '',
          campaign_text_ar: data.campaign_text_ar || '',
          campaign_text_fr: data.campaign_text_fr || '',
          campaign_text_pt: data.campaign_text_pt || '',
          campaign_text_ru: data.campaign_text_ru || '',
          campaign_text_de: data.campaign_text_de || '',
          campaign_text_fa: data.campaign_text_fa || ''
        });
        if (data.working_hours || data.maps_url || data.instagram_url || data.phone_number) {
          setShowExtraInfo(true);
        }
        if (data.campaign_text || data.campaign_text_en || data.campaign_text_es || data.campaign_text_ar || data.campaign_text_fr || data.campaign_text_pt || data.campaign_text_ru || data.campaign_text_de || data.campaign_text_fa) {
          setShowCampaign(true);
        }
      }
    } catch (error) {
      console.error("Error fetching cafe details:", error);
    }
  };

  const handleUpdateBranding = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        hero_image: branding.hero_image,
        coverImage: branding.coverImage,
        cover_image: branding.coverImage, // both camelCase and snake_case for maximum compatibility
        primary_color: branding.primary_color,
        accent_color: branding.accent_color,
        bg_color: branding.bg_color,
        custom_domain: branding.custom_domain,
        working_hours: branding.working_hours || '',
        maps_url: branding.maps_url || '',
        instagram_url: branding.instagram_url || '',
        phone_number: branding.phone_number || '',
        has_english: branding.has_english || false,
        has_spanish: branding.has_spanish || false,
        has_arabic: branding.has_arabic || false,
        isFrenchActive: branding.isFrenchActive || branding.has_french || false,
        has_french: branding.has_french || branding.isFrenchActive || false,
        isPortugueseActive: branding.isPortugueseActive || branding.has_portuguese || false,
        has_portuguese: branding.has_portuguese || branding.isPortugueseActive || false,
        isRussianActive: branding.isRussianActive || branding.has_russian || false,
        has_russian: branding.has_russian || branding.isRussianActive || false,
        isGermanActive: branding.isGermanActive || branding.has_german || false,
        has_german: branding.has_german || branding.isGermanActive || false,
        isPersianActive: branding.isPersianActive || branding.has_persian || false,
        has_persian: branding.has_persian || branding.isPersianActive || false,
        campaign_text: branding.campaign_text || '',
        campaign_text_en: branding.campaign_text_en || '',
        campaign_text_es: branding.campaign_text_es || '',
        campaign_text_ar: branding.campaign_text_ar || '',
        campaign_text_fr: branding.campaign_text_fr || '',
        campaign_text_pt: branding.campaign_text_pt || '',
        campaign_text_ru: branding.campaign_text_ru || '',
        campaign_text_de: branding.campaign_text_de || '',
        campaign_text_fa: branding.campaign_text_fa || ''
      };

      const response = await fetch(`${API_BASE_URL}/api/cafes/${id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      
      if (handleAuthError(response)) return;

      if (response.ok) {
        const updatedCafe = await response.json();
        setCafeDetails(updatedCafe);
        setBranding(prev => ({ ...prev, ...updatedCafe }));
        showToast("Görünüm ayarları başarıyla güncellendi!", "success");
        setIsSettingsOpen(false);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Görünüm ayarları güncellenemedi.", "error");
        console.error("Backend Hatası:", errorData);
      }
    } catch (error) {
      showToast("Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.", "error");
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

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData(initialCategoryFormData);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || '',
      name_en: category.name_en || '',
      name_es: category.name_es || '',
      name_ar: category.name_ar || '',
      name_fr: category.name_fr || '',
      name_pt: category.name_pt || '',
      name_ru: category.name_ru || '',
      name_de: category.name_de || '',
      name_fa: category.name_fa || '',
      order_index: category.order_index || 0
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const isEdit = !!editingCategory;
      const url = isEdit 
        ? `${API_BASE_URL}/api/categories/${editingCategory.id}`
        : `${API_BASE_URL}/api/categories`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...categoryFormData,
        order_index: parseInt(categoryFormData.order_index) || 0
      };
      if (!isEdit) {
        payload.cafe_id = parseInt(id);
      }

      const response = await fetch(url, {
        method: method,
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const savedCategory = await response.json();
        if (isEdit) {
          setCategories(prev => prev.map(c => c.id === savedCategory.id ? savedCategory : c));
          showToast("Kategori başarıyla güncellendi!", "success");
        } else {
          setCategories(prev => [...prev, savedCategory]);
          showToast("Yeni kategori başarıyla eklendi!", "success");
        }
        setCategoryFormData(initialCategoryFormData);
        setEditingCategory(null);
        setIsCategoryModalOpen(false);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Kategori kaydedilemedi.", "error");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      showToast("Kategori kaydedilirken bağlantı hatası oluştu.", "error");
    }
  };

  const confirmDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        showToast("Kategori başarıyla silindi!", "success");
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
      } else {
        const errorData = await response.json();
        alert("Kategori silinirken hata oluştu: " + (errorData.error || response.statusText));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Sunucu hatası: Kategori silinemedi.");
    } finally {
      setIsDeletingCategory(false);
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

  const handleUploadImage = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. MIME-Type Kontrolü (Sadece JPEG, PNG ve WebP)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      alert("Lütfen sadece JPEG, PNG veya WebP formatında bir görsel seçin.");
      e.target.value = ''; // Inputu temizle
      return;
    }

    // 2. Dosya Boyutu Kontrolü (5 MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("Görsel boyutu 5MB'tan büyük olamaz. Lütfen TinyPNG ile sıkıştırıp tekrar deneyin.");
      e.target.value = ''; // Inputu temizle
      return;
    }

    if (type === 'add') {
      setIsAddUploading(true);
    } else {
      setIsEditUploading(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Yükleme hatası (${response.status})`);
      }

      const data = await response.json();
      const publicUrl = data.url || data.publicUrl;

      if (type === 'add') {
        setProductFormData(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setEditProductFormData(prev => ({ ...prev, image_url: publicUrl }));
      }
    } catch (error) {
      console.error("Görsel yükleme hatası:", error);
      alert("Görsel yüklenirken bir hata oluştu: " + error.message);
    } finally {
      if (type === 'add') {
        setIsAddUploading(false);
      } else {
        setIsEditUploading(false);
      }
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
          name: productFormData.name,
          name_en: productFormData.name_en || null,
          name_es: productFormData.name_es || null,
          name_ar: productFormData.name_ar || null,
          name_fr: productFormData.name_fr || null,
          name_pt: productFormData.name_pt || null,
          name_ru: productFormData.name_ru || null,
          name_de: productFormData.name_de || null,
          name_fa: productFormData.name_fa || null,
          description: productFormData.description || null,
          description_en: productFormData.description_en || null,
          description_es: productFormData.description_es || null,
          description_ar: productFormData.description_ar || null,
          description_fr: productFormData.description_fr || null,
          description_pt: productFormData.description_pt || null,
          description_ru: productFormData.description_ru || null,
          description_de: productFormData.description_de || null,
          description_fa: productFormData.description_fa || null,
          price: parseFloat(productFormData.price),
          image_url: productFormData.image_url || null,
          is_active: true
        }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([newProduct, ...products]); 
        setProductFormData(initialProductFormData);
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
    setEditProductFormData({
      name: product.name || '',
      name_en: product.name_en || '',
      name_es: product.name_es || '',
      name_ar: product.name_ar || '',
      name_fr: product.name_fr || '',
      name_pt: product.name_pt || '',
      name_ru: product.name_ru || '',
      name_de: product.name_de || '',
      name_fa: product.name_fa || '',
      price: product.price !== undefined ? product.price : '',
      description: product.description || '',
      description_en: product.description_en || '',
      description_es: product.description_es || '',
      description_ar: product.description_ar || '',
      description_fr: product.description_fr || '',
      description_pt: product.description_pt || '',
      description_ru: product.description_ru || '',
      description_de: product.description_de || '',
      description_fa: product.description_fa || '',
      image_url: product.image_url || '',
    });
    setIsEditProductModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProductToEdit.id}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: editProductFormData.name,
          name_en: editProductFormData.name_en || null,
          name_es: editProductFormData.name_es || null,
          name_ar: editProductFormData.name_ar || null,
          name_fr: editProductFormData.name_fr || null,
          name_pt: editProductFormData.name_pt || null,
          name_ru: editProductFormData.name_ru || null,
          name_de: editProductFormData.name_de || null,
          name_fa: editProductFormData.name_fa || null,
          description: editProductFormData.description || null,
          description_en: editProductFormData.description_en || null,
          description_es: editProductFormData.description_es || null,
          description_ar: editProductFormData.description_ar || null,
          description_fr: editProductFormData.description_fr || null,
          description_pt: editProductFormData.description_pt || null,
          description_ru: editProductFormData.description_ru || null,
          description_de: editProductFormData.description_de || null,
          description_fa: editProductFormData.description_fa || null,
          price: parseFloat(editProductFormData.price),
          image_url: editProductFormData.image_url || null
        }),
      });

      if (handleAuthError(response)) return;

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(prod => prod.id === selectedProductToEdit.id ? updatedProduct : prod));
        setIsEditProductModalOpen(false);
        alert("Ürün başarıyla güncellendi!");
      } else {
        const errorData = await response.json();
        console.error("Ürün güncelleme sunucu hatası:", errorData);
        alert("Ürün güncellenemedi: " + (errorData.error || "Bilinmeyen hata. Lütfen tekrar deneyin."));
      }
    } catch (error) {
      console.error("Ürün güncelleme bağlantı hatası:", error);
      alert("Ürün güncellenemedi, lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 font-sans relative">
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

      <div className="max-w-6xl mx-auto">
        
        {/* Başlık ve Üst Menü */}
        <div className="mb-8">
          {!isCafeOwner ? (
            <Link to="/admin" className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1">
              ← SaaS Kontrol Merkezine Dön
            </Link>
          ) : (
            <div className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block mb-1">
              🔒 Kafe Yönetim Paneli
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4 border-b border-slate-700 pb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 break-words">
              Menü Yönetimi: {cafeDetails ? cafeDetails.name : `Yükleniyor (ID: ${id})`}
            </h1>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
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
                  className="flex-1 sm:flex-initial justify-center bg-blue-600 hover:bg-blue-500 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all border border-blue-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40 text-sm sm:text-base"
                >
                  🔗 Siteye Git
                </a>
              )}
              {/* Görünüm Özelleştirme Butonu */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex-1 sm:flex-initial justify-center bg-slate-700 hover:bg-slate-600 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all border border-slate-600 flex items-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                🎨 Görünümü Özelleştir
              </button>
              <button 
                onClick={openCreateCategory}
                className="w-full sm:w-auto text-center bg-emerald-600 hover:bg-emerald-500 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/50 cursor-pointer text-sm sm:text-base"
              >
                + Yeni Kategori
              </button>
              {/* Çıkış Yap Butonu */}
              <button 
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full sm:w-auto text-center bg-slate-800 hover:bg-slate-750 border border-slate-700 px-4 sm:px-5 py-2 rounded-lg font-semibold text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                title="Oturumu Kapat"
              >
                🚪 Çıkış Yap
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
                className="bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-600 transition-colors group"
              >
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-200">{category.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Sıralama (Order Index): {category.order_index}</p>
                </div>
                
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t border-slate-700/50 sm:border-t-0">
                  <button 
                    onClick={() => openProductManager(category)}
                    className="text-xs sm:text-sm bg-blue-900/50 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-full border border-blue-800 transition-all font-medium flex-1 sm:flex-none text-center"
                  >
                    Ürünleri Yönet →
                  </button>
                  <button 
                    onClick={() => openEditCategory(category)}
                    className="text-slate-400 hover:text-blue-400 transition-colors p-1 cursor-pointer"
                    title="Kategoriyi Düzenle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => confirmDeleteCategory(category)}
                    className="text-slate-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
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

        {/* KATEGORİ EKLEME / DÜZENLEME MODALI (Z-INDEX 1000) */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur'}
              </h2>
              <form onSubmit={handleSaveCategory}>
                {/* Dinamik Kategori Adı Inputları */}
                {activeLanguages.map((langConfig) => {
                  const fieldKey = `name${langConfig.key}`;
                  const labelText = langConfig.isDefault ? "Kategori Adı" : `Kategori Adı (${langConfig.name})`;
                  const isRtl = langConfig.dir === 'rtl';
                  return (
                    <div key={fieldKey} className="mb-4">
                      <label className="block text-slate-400 mb-2 font-medium">{labelText}</label>
                      <input 
                        type="text" 
                        required={langConfig.isDefault}
                        value={categoryFormData[fieldKey] || ''}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className={`w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 ${isRtl ? 'text-right' : ''}`}
                        placeholder={langConfig.placeholder ? `Örn: ${langConfig.placeholder}` : "Kategori Adı"}
                        dir={langConfig.dir || 'auto'}
                      />
                    </div>
                  );
                })}
                <div className="mb-6">
                  <label className="block text-slate-400 mb-2 font-medium">Sıralama (Order Index)</label>
                  <input 
                    type="number" 
                    required
                    value={categoryFormData.order_index}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, order_index: e.target.value }))}
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

        {/* KATEGORİ SİLME ONAY MODALI (Z-INDEX 2000) */}
        {isDeleteModalOpen && categoryToDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[2000] backdrop-blur-sm">
            <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-xl font-bold">
                  ⚠️
                </div>
                <h2 className="text-xl font-bold text-white">Kategoriyi Sil</h2>
              </div>
              
              <p className="text-slate-300 mb-6 text-sm sm:text-base leading-relaxed">
                <span className="font-bold text-white">"{categoryToDelete.name}"</span> kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  disabled={isDeletingCategory}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCategoryToDelete(null);
                  }} 
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 bg-slate-800 border border-slate-600 transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button 
                  type="button" 
                  disabled={isDeletingCategory}
                  onClick={handleConfirmDeleteCategory} 
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeletingCategory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    'Evet, Sil'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ÜRÜN YÖNETİM MODALI (Z-INDEX 1000) */}
        {isProductModalOpen && selectedCategory && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm">
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
                <div className="w-full md:w-1/3 p-6 bg-slate-850 border-r border-slate-700 overflow-y-auto max-h-[80vh]">
                  <h3 className="text-lg font-bold text-slate-300 mb-4">Hızlı Ürün Ekle</h3>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    
                    {/* Dinamik Ürün Adı Inputları */}
                    {activeLanguages.map((langConfig) => {
                      const fieldKey = `name${langConfig.key}`;
                      const labelText = langConfig.isDefault ? "Ürün Adı" : `Ürün Adı (${langConfig.name})`;
                      const isRtl = langConfig.dir === 'rtl';
                      return (
                        <div key={fieldKey}>
                          <label className="block text-sm text-slate-400 mb-1 font-medium">{labelText}</label>
                          <input 
                            type="text" 
                            required={langConfig.isDefault}
                            value={productFormData[fieldKey] || ''} 
                            onChange={(e) => handleProductFormChange(fieldKey, e.target.value)} 
                            className={`w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-emerald-500 ${isRtl ? 'text-right' : ''}`} 
                            placeholder={langConfig.placeholder || "Örn: Fırın Sütlaç"} 
                            dir={langConfig.dir || 'auto'}
                          />
                        </div>
                      );
                    })}

                    {/* Fiyat Inputu (Sabit) */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1 font-medium">Fiyat (TL)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={productFormData.price} 
                        onChange={(e) => handleProductFormChange('price', e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-emerald-500" 
                        placeholder="120.50" 
                      />
                    </div>

                    {/* Dinamik Açıklama Textarea'ları */}
                    {activeLanguages.map((langConfig) => {
                      const fieldKey = `description${langConfig.key}`;
                      const labelText = langConfig.isDefault 
                        ? "Açıklama (İsteğe Bağlı)" 
                        : `Açıklama (${langConfig.name} - İsteğe Bağlı)`;
                      const isRtl = langConfig.dir === 'rtl';
                      return (
                        <div key={fieldKey}>
                          <label className="block text-sm text-slate-400 mb-1 font-medium">{labelText}</label>
                          <textarea 
                            value={productFormData[fieldKey] || ''} 
                            onChange={(e) => handleProductFormChange(fieldKey, e.target.value)} 
                            className={`w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-emerald-500 ${isRtl ? 'text-right' : ''}`} 
                            rows="2" 
                            placeholder={langConfig.descPlaceholder || "İçindekiler vb."}
                            dir={langConfig.dir || 'auto'}
                          ></textarea>
                        </div>
                      );
                    })}

                    {/* Görsel Yükleme Area */}
                    <div className="pt-2">
                      <label className="block text-sm text-slate-400 mb-1 font-medium">Görsel (İsteğe Bağlı)</label>
                      <div className="flex flex-col gap-2">
                        {productFormData.image_url ? (
                          <div className="flex items-center gap-3 bg-slate-900 border border-slate-600 rounded p-2">
                            <ImageWithSkeleton src={productFormData.image_url} alt="Önizleme" className="w-12 h-12 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-400 truncate">{productFormData.image_url}</p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleProductFormChange('image_url', '')} 
                              className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1"
                            >
                              Sil
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input 
                              type="file" 
                              id="add-product-image-file" 
                              accept="image/*" 
                              onChange={(e) => handleUploadImage(e, 'add')} 
                              className="hidden" 
                              disabled={isAddUploading}
                            />
                            <label 
                              htmlFor="add-product-image-file" 
                              className={`flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-lg p-3 cursor-pointer hover:border-emerald-500 hover:bg-slate-800 transition-all ${isAddUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span>{isAddUploading ? '⏳ Yükleniyor...' : '📸 Görsel Seç'}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="submit" disabled={isAddUploading} className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
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
                              {product.image_url ? <ImageWithSkeleton src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : '🍽️'}
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

        {/* TASARIM AYARLARI MODALI (Z-INDEX 1000) */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
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

                <div className="mb-4">
                  <label className="block text-slate-400 mb-1 text-sm font-medium">Kapak Fotoğrafı URL'i (coverImage)</label>
                  <input 
                    type="text" 
                    value={branding.coverImage || ''}
                    onChange={(e) => setBranding({...branding, coverImage: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Müşteri arayüzünde banner arka planı olarak kullanılacak kapak fotoğrafı.</p>
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

                <div className="mb-4">
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

                {/* İletişim ve Ekstra Bilgiler Ekle Toggle */}
                <div className="border-t border-slate-700/50 pt-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={showExtraInfo}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowExtraInfo(checked);
                        if (!checked) {
                          setBranding(prev => ({
                            ...prev,
                            working_hours: '',
                            maps_url: '',
                            instagram_url: '',
                            phone_number: ''
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      İletişim ve Ekstra Bilgiler Ekle
                    </span>
                  </label>
                </div>

                {/* Çoklu Dil Desteği Toggles */}
                <div className="border-t border-slate-700/50 pt-4 mt-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menü Dil Desteği</p>
                  
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.has_english || false}
                      onChange={(e) => setBranding({...branding, has_english: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      İngilizce Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.has_spanish || false}
                      onChange={(e) => setBranding({...branding, has_spanish: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      İspanyolca Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.has_arabic || false}
                      onChange={(e) => setBranding({...branding, has_arabic: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Arapça Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.isFrenchActive || branding.has_french || false}
                      onChange={(e) => setBranding({...branding, isFrenchActive: e.target.checked, has_french: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Fransızca (FR) Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.isPortugueseActive || branding.has_portuguese || false}
                      onChange={(e) => setBranding({...branding, isPortugueseActive: e.target.checked, has_portuguese: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Portekizce (PT) Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.isRussianActive || branding.has_russian || false}
                      onChange={(e) => setBranding({...branding, isRussianActive: e.target.checked, has_russian: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Rusça (RU) Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.isGermanActive || branding.has_german || false}
                      onChange={(e) => setBranding({...branding, isGermanActive: e.target.checked, has_german: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Almanca (DE) Menü Desteğini Aç
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={branding.isPersianActive || branding.has_persian || false}
                      onChange={(e) => setBranding({...branding, isPersianActive: e.target.checked, has_persian: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Farsça (FA) Menü Desteğini Aç
                    </span>
                  </label>
                </div>

                {/* Kampanya Bannerı Toggle */}
                <div className="border-t border-slate-700/50 pt-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={showCampaign}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowCampaign(checked);
                        if (!checked) {
                          setBranding(prev => ({
                            ...prev,
                            campaign_text: '',
                            campaign_text_en: '',
                            campaign_text_es: '',
                            campaign_text_ar: '',
                            campaign_text_fr: '',
                            campaign_text_pt: '',
                            campaign_text_ru: '',
                            campaign_text_de: '',
                            campaign_text_fa: ''
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      🎉 Kampanya Bannerı Ekle
                    </span>
                  </label>
                </div>

                {/* Koşullu Kampanya Girişleri (Dinamik Diller) */}
                {showCampaign && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 space-y-4">
                    {activeLanguages.map((langConfig) => {
                      const fieldKey = `campaign_text${langConfig.key}`;
                      const labelText = langConfig.isDefault ? "Kampanya Metni (TR)" : `Kampanya Metni (${langConfig.name})`;
                      const isRtl = langConfig.dir === 'rtl';
                      return (
                        <div key={fieldKey}>
                          <label className="block text-slate-400 mb-1 text-xs font-medium">{labelText}</label>
                          <input 
                            type="text" 
                            value={branding[fieldKey] || ''}
                            onChange={(e) => setBranding(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                            className={`w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500 ${isRtl ? 'text-right' : ''}`}
                            placeholder={langConfig.isDefault ? "Örn: Kahve + Tatlı Menüsü Sadece 150₺!" : `Örn: ${langConfig.name} Kampanya Metni`}
                            dir={langConfig.dir || 'auto'}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Koşullu Açılır Alan */}
                {showExtraInfo && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1 text-xs font-medium">Çalışma Saatleri</label>
                        <input 
                          type="text" 
                          value={branding.working_hours || ''}
                          onChange={(e) => setBranding({...branding, working_hours: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Örn: 09:00 - 23:00"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 text-xs font-medium">Telefon Numarası</label>
                        <input 
                          type="text" 
                          value={branding.phone_number || ''}
                          onChange={(e) => setBranding({...branding, phone_number: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Örn: 0212 345 67 89"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-xs font-medium">Google Maps Linki</label>
                      <input 
                        type="text" 
                        value={branding.maps_url || ''}
                        onChange={(e) => setBranding({...branding, maps_url: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Örn: https://maps.app.goo.gl/..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-xs font-medium">Instagram Linki</label>
                      <input 
                        type="text" 
                        value={branding.instagram_url || ''}
                        onChange={(e) => setBranding({...branding, instagram_url: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Örn: https://instagram.com/hesapadi"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 rounded-lg text-slate-300 hover:bg-slate-700">İptal</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-bold text-white shadow-lg shadow-blue-900/50">Ayarları Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ÜRÜN DÜZENLEME MODALI (Z-INDEX 2000) */}
        {isEditProductModalOpen && selectedProductToEdit && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[2000] backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Ürünü Düzenle</h2>
                <button onClick={() => setIsEditProductModalOpen(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                
                {/* Dinamik Ürün Adı Inputları */}
                {activeLanguages.map((langConfig) => {
                  const fieldKey = `name${langConfig.key}`;
                  const labelText = langConfig.isDefault ? "Ürün Adı" : `Ürün Adı (${langConfig.name})`;
                  const isRtl = langConfig.dir === 'rtl';
                  return (
                    <div key={fieldKey}>
                      <label className="block text-sm text-slate-400 mb-1 font-medium">{labelText}</label>
                      <input 
                        type="text" 
                        required={langConfig.isDefault}
                        value={editProductFormData[fieldKey] || ''} 
                        onChange={(e) => handleEditProductFormChange(fieldKey, e.target.value)} 
                        className={`w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 ${isRtl ? 'text-right' : ''}`} 
                        dir={langConfig.dir || 'auto'}
                      />
                    </div>
                  );
                })}

                {/* Fiyat Inputu (Sabit) */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Fiyat (TL)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editProductFormData.price} 
                    onChange={(e) => handleEditProductFormChange('price', e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>

                {/* Dinamik Açıklama Textarea'ları */}
                {activeLanguages.map((langConfig) => {
                  const fieldKey = `description${langConfig.key}`;
                  const labelText = langConfig.isDefault ? "Açıklama" : `Açıklama (${langConfig.name})`;
                  const isRtl = langConfig.dir === 'rtl';
                  return (
                    <div key={fieldKey}>
                      <label className="block text-sm text-slate-400 mb-1 font-medium">{labelText}</label>
                      <textarea 
                        value={editProductFormData[fieldKey] || ''} 
                        onChange={(e) => handleEditProductFormChange(fieldKey, e.target.value)} 
                        className={`w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm focus:outline-none focus:border-blue-500 ${isRtl ? 'text-right' : ''}`} 
                        rows="3"
                        dir={langConfig.dir || 'auto'}
                      ></textarea>
                    </div>
                  );
                })}

                {/* Görsel Yükleme Area */}
                <div className="pt-2">
                  <label className="block text-sm text-slate-400 mb-1 font-medium">Görsel</label>
                  <div className="flex flex-col gap-2">
                    {editProductFormData.image_url ? (
                      <div className="flex items-center gap-3 bg-slate-900 border border-slate-600 rounded p-3">
                        <ImageWithSkeleton src={editProductFormData.image_url} alt="Önizleme" className="w-14 h-14 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 truncate">{editProductFormData.image_url}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleEditProductFormChange('image_url', '')} 
                          className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1"
                        >
                          Sil
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          id="edit-product-image-file" 
                          accept="image/*" 
                          onChange={(e) => handleUploadImage(e, 'edit')} 
                          className="hidden" 
                          disabled={isEditUploading}
                        />
                        <label 
                          htmlFor="edit-product-image-file" 
                          className={`flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-slate-900 transition-all ${isEditUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>{isEditUploading ? '⏳ Yükleniyor...' : '📸 Görsel Değiştir'}</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditProductModalOpen(false)} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 font-medium">İptal</button>
                  <button type="submit" disabled={isSavingProduct || isEditUploading} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg font-bold text-white shadow-lg shadow-blue-900/50 transition-colors disabled:opacity-50">
                    {isSavingProduct ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
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