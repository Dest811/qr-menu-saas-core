const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Boş metin (whitespace / empty string) sanitizasyonu için yardımcı fonksiyon
const cleanStr = (val) => (val && typeof val === 'string' && val.trim() !== '') ? val.trim() : null;

// Güvenli URL doğrulama (javascript:, data:, vb. XSS protokollerini engeller)
const safeUrl = (val) => {
  const cleaned = cleanStr(val);
  if (!cleaned) return null;
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return cleaned;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Hassas verileri (password_hash ve halka açık rotalarda username) temizleyen yardımcı fonksiyon
const sanitizeCafe = (cafe, includeUsername = false) => {
  if (!cafe) return null;
  const { password_hash, username, ...publicCafe } = cafe;
  if (includeUsername) {
    return { ...publicCafe, username };
  }
  return publicCafe;
};

// 1. Tüm kafeleri getir (GET) - Admin panelinde listelemek için ([KORUMALI - SÜPER ADMİN])
const getAllCafes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cafes ORDER BY created_at DESC');
    res.json(result.rows.map(c => sanitizeCafe(c, true)));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafeler listelenirken sunucu hatası oluştu." });
  }
};

// 2. ID'ye göre tekil kafe getir (GET) - (Açık rota - password_hash ve username gizlenir)
const getCafeById = async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id, 10);
    if (isNaN(cafeId)) {
      return res.status(400).json({ error: "Geçersiz kafe kimliği." });
    }
    const result = await pool.query('SELECT * FROM cafes WHERE id = $1 LIMIT 1', [cafeId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Böyle bir kafe bulunamadı." });
    }
    res.json(sanitizeCafe(result.rows[0], false));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe bilgisi alınırken sunucu hatası oluştu." });
  }
};

// 3. Slug'a göre tekil kafe getir (GET) - (Açık rota - password_hash ve username gizlenir)
const getCafeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = cleanStr(slug);
    if (!cleanSlug) {
      return res.status(400).json({ error: "Geçersiz kafe adresi." });
    }
    const result = await pool.query('SELECT * FROM cafes WHERE slug = $1 LIMIT 1', [cleanSlug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bu adrese ait bir kafe bulunamadı." });
    }
    res.json(sanitizeCafe(result.rows[0], false));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe bilgisi alınırken sunucu hatası oluştu." });
  }
};

// 4. Custom Domain'e göre tekil kafe getir (GET) - (Açık rota - password_hash ve username gizlenir)
const getCafeByDomain = async (req, res) => {
  try {
    const { domainName } = req.params;
    const cleanDomain = cleanStr(domainName);
    if (!cleanDomain) {
      return res.status(400).json({ error: "Geçersiz alan adı." });
    }
    const result = await pool.query('SELECT * FROM cafes WHERE LOWER(custom_domain) = LOWER($1) LIMIT 1', [cleanDomain]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bu alan adına ait bir kafe bulunamadı." });
    }
    res.json(sanitizeCafe(result.rows[0], false));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Domain eşleştirmesi yapılırken sunucu hatası oluştu." });
  }
};

// 5. Yeni kafe ekleme (POST) - [KORUMALI - SÜPER ADMİN]
const createCafe = async (req, res) => {
  const { name, slug, username, password, logo_url, hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa } = req.body;
  
  const cleanName = cleanStr(name);
  const cleanSlugVal = cleanStr(slug);
  if (!cleanName || !cleanSlugVal) {
    return res.status(400).json({ error: "Kafe adı ve adresi (slug) zorunludur." });
  }

  const finalSlug = cleanSlugVal;
  const finalUsername = cleanStr(username) || finalSlug;
  const cleanDomainVal = cleanStr(custom_domain);

  // --- BENZERSİZLİK (UNIQUE) KONTROLLERİ ---
  const slugCheck = await pool.query('SELECT id FROM cafes WHERE LOWER(slug) = LOWER($1) LIMIT 1', [finalSlug]);
  if (slugCheck.rows.length > 0) {
    return res.status(400).json({ error: "Bu sistem linki (slug) zaten başka bir kafe tarafından kullanılıyor." });
  }

  if (cleanDomainVal) {
    const domainCheck = await pool.query('SELECT id FROM cafes WHERE LOWER(custom_domain) = LOWER($1) LIMIT 1', [cleanDomainVal]);
    if (domainCheck.rows.length > 0) {
      return res.status(400).json({ error: "Bu özel alan adı (custom domain) zaten başka bir kafe tarafından kullanılıyor." });
    }
  }

  const usernameCheck = await pool.query('SELECT id FROM cafes WHERE LOWER(username) = LOWER($1) LIMIT 1', [finalUsername]);
  if (usernameCheck.rows.length > 0) {
    return res.status(400).json({ error: "Bu kullanıcı adı (username) zaten başka bir kafe tarafından kullanılıyor." });
  }

  let password_hash = null;
  if (password && password.trim()) {
    password_hash = await bcrypt.hash(password.trim(), 10);
  }

  const coverImage = safeUrl(req.body.coverImage ?? req.body.cover_image);
  const finalMapsUrl = safeUrl(maps_url ?? req.body.Maps_url);

  // Esnek dil kontrolü
  const is_english = Boolean(req.body.has_english ?? req.body.isEnglishActive ?? req.body.hasEnglish ?? false);
  const is_spanish = Boolean(req.body.has_spanish ?? req.body.isSpanishActive ?? req.body.hasSpanish ?? false);
  const is_arabic = Boolean(req.body.has_arabic ?? req.body.isArabicActive ?? req.body.hasArabic ?? false);
  const is_french = Boolean(req.body.has_french ?? req.body.isFrenchActive ?? req.body.hasFrench ?? false);
  const is_portuguese = Boolean(req.body.has_portuguese ?? req.body.isPortugueseActive ?? req.body.hasPortuguese ?? false);
  const is_russian = Boolean(req.body.has_russian ?? req.body.isRussianActive ?? req.body.hasRussian ?? false);
  const is_german = Boolean(req.body.has_german ?? req.body.isGermanActive ?? req.body.hasGerman ?? false);
  const is_persian = Boolean(req.body.has_persian ?? req.body.isPersianActive ?? req.body.hasPersian ?? false);

  try {
    const newCafe = await pool.query(
      'INSERT INTO cafes (name, slug, username, password_hash, logo_url, hero_image, "coverImage", primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, has_english, has_spanish, has_arabic, "isFrenchActive", has_french, "isPortugueseActive", has_portuguese, "isRussianActive", has_russian, "isGermanActive", has_german, "isPersianActive", has_persian, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37) RETURNING *',
      [
        cleanName, 
        finalSlug, 
        finalUsername,
        password_hash,
        safeUrl(logo_url), 
        safeUrl(hero_image), 
        coverImage,
        cleanStr(primary_color), 
        cleanStr(accent_color), 
        cleanStr(bg_color), 
        cleanDomainVal,
        cleanStr(working_hours),
        finalMapsUrl,
        safeUrl(instagram_url),
        cleanStr(phone_number),
        is_english,
        is_spanish,
        is_arabic,
        is_french,
        is_french,
        is_portuguese,
        is_portuguese,
        is_russian,
        is_russian,
        is_german,
        is_german,
        is_persian,
        is_persian,
        cleanStr(campaign_text),
        cleanStr(campaign_text_en),
        cleanStr(campaign_text_es),
        cleanStr(campaign_text_ar),
        cleanStr(campaign_text_fr),
        cleanStr(campaign_text_pt),
        cleanStr(campaign_text_ru),
        cleanStr(campaign_text_de),
        cleanStr(campaign_text_fa)
      ]
    );
    res.json(sanitizeCafe(newCafe.rows[0], true));
  } catch (err) {
    console.error("Kafe oluşturma hatası:", err.message);
    if (err.code === '23505') {
      if (err.detail?.includes('custom_domain') || err.message.includes('custom_domain')) {
        return res.status(400).json({ error: "Bu özel alan adı (custom domain) zaten başka bir kafe tarafından kullanılıyor." });
      }
      if (err.detail?.includes('slug') || err.message.includes('slug')) {
        return res.status(400).json({ error: "Bu sistem linki (slug) zaten başka bir kafe tarafından kullanılıyor." });
      }
      if (err.detail?.includes('username') || err.message.includes('username')) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten başka bir kafe tarafından kullanılıyor." });
      }
      return res.status(400).json({ error: "Girilen bilgilerden biri sistemde zaten kullanılıyor." });
    }
    res.status(500).json({ error: "Kafe eklenirken bir sunucu hatası oluştu." });
  }
};

// 6. Kafeyi Güncelle (PUT) - [KORUMALI]
const updateCafe = async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id, 10);
    if (isNaN(cafeId)) {
      return res.status(400).json({ error: "Geçersiz kafe kimliği." });
    }

    // Mevcut kafeyi çek (kısmi güncelleme veya rol bazlı koruma için)
    const existingResult = await pool.query('SELECT * FROM cafes WHERE id = $1 LIMIT 1', [cafeId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek kafe bulunamadı." });
    }
    const existing = existingResult.rows[0];
    const isSuperAdmin = req.user && req.user.role === 'superadmin';

    const { name, slug, username, password, hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa } = req.body;
    
    // Sadece superadmin yönetim alanlarını (name, slug, username, password, custom_domain) değiştirebilir
    const finalName = (isSuperAdmin && name !== undefined) ? (cleanStr(name) || existing.name) : existing.name;
    const finalSlug = (isSuperAdmin && slug !== undefined) ? (cleanStr(slug) || existing.slug) : existing.slug;
    const finalUsername = (isSuperAdmin && username !== undefined) ? (cleanStr(username) || existing.username) : existing.username;
    const cleanDomainVal = (isSuperAdmin && custom_domain !== undefined) ? cleanStr(custom_domain) : existing.custom_domain;

    // --- BENZERSİZLİK (UNIQUE) KONTROLLERİ ---
    if (cleanDomainVal) {
      const domainCheck = await pool.query(
        'SELECT id FROM cafes WHERE LOWER(custom_domain) = LOWER($1) AND id != $2 LIMIT 1',
        [cleanDomainVal, cafeId]
      );
      if (domainCheck.rows.length > 0) {
        return res.status(400).json({ error: "Bu özel alan adı (custom domain) zaten başka bir kafe tarafından kullanılıyor." });
      }
    }

    if (finalUsername) {
      const usernameCheck = await pool.query(
        'SELECT id FROM cafes WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1',
        [finalUsername, cafeId]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten başka bir kafe tarafından kullanılıyor." });
      }
    }

    if (finalSlug) {
      const slugCheck = await pool.query(
        'SELECT id FROM cafes WHERE LOWER(slug) = LOWER($1) AND id != $2 LIMIT 1',
        [finalSlug, cafeId]
      );
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ error: "Bu sistem linki (slug) zaten başka bir kafe tarafından kullanılıyor." });
      }
    }

    let password_hash = existing.password_hash;
    if (isSuperAdmin && password && password.trim()) {
      password_hash = await bcrypt.hash(password.trim(), 10);
    }

    // Eğer Admin.jsx'ten sadece yönetim bilgileri gönderildiyse mevcut görsel/renk ayarlarını koru
    const finalHeroImage = hero_image !== undefined ? safeUrl(hero_image) : existing.hero_image;
    const rawCover = req.body.coverImage ?? req.body.cover_image;
    const finalCoverImage = rawCover !== undefined ? safeUrl(rawCover) : existing.coverImage;
    const finalPrimaryColor = primary_color !== undefined ? cleanStr(primary_color) : existing.primary_color;
    const finalAccentColor = accent_color !== undefined ? cleanStr(accent_color) : existing.accent_color;
    const finalBgColor = bg_color !== undefined ? cleanStr(bg_color) : existing.bg_color;
    const finalWorkingHours = working_hours !== undefined ? cleanStr(working_hours) : existing.working_hours;
    const rawMaps = maps_url ?? req.body.Maps_url;
    const finalMapsUrl = rawMaps !== undefined ? safeUrl(rawMaps) : existing.maps_url;
    const finalInstagramUrl = instagram_url !== undefined ? safeUrl(instagram_url) : existing.instagram_url;
    const finalPhoneNumber = phone_number !== undefined ? cleanStr(phone_number) : existing.phone_number;

    // Esnek dil kontrolü (Gönderilmediyse mevcut değeri koru)
    const is_english = (req.body.has_english ?? req.body.isEnglishActive ?? req.body.hasEnglish) !== undefined
      ? Boolean(req.body.has_english ?? req.body.isEnglishActive ?? req.body.hasEnglish)
      : Boolean(existing.has_english);
    const is_spanish = (req.body.has_spanish ?? req.body.isSpanishActive ?? req.body.hasSpanish) !== undefined
      ? Boolean(req.body.has_spanish ?? req.body.isSpanishActive ?? req.body.hasSpanish)
      : Boolean(existing.has_spanish);
    const is_arabic = (req.body.has_arabic ?? req.body.isArabicActive ?? req.body.hasArabic) !== undefined
      ? Boolean(req.body.has_arabic ?? req.body.isArabicActive ?? req.body.hasArabic)
      : Boolean(existing.has_arabic);
    const is_french = (req.body.has_french ?? req.body.isFrenchActive ?? req.body.hasFrench) !== undefined
      ? Boolean(req.body.has_french ?? req.body.isFrenchActive ?? req.body.hasFrench)
      : Boolean(existing.has_french || existing.isFrenchActive);
    const is_portuguese = (req.body.has_portuguese ?? req.body.isPortugueseActive ?? req.body.hasPortuguese) !== undefined
      ? Boolean(req.body.has_portuguese ?? req.body.isPortugueseActive ?? req.body.hasPortuguese)
      : Boolean(existing.has_portuguese || existing.isPortugueseActive);
    const is_russian = (req.body.has_russian ?? req.body.isRussianActive ?? req.body.hasRussian) !== undefined
      ? Boolean(req.body.has_russian ?? req.body.isRussianActive ?? req.body.hasRussian)
      : Boolean(existing.has_russian || existing.isRussianActive);
    const is_german = (req.body.has_german ?? req.body.isGermanActive ?? req.body.hasGerman) !== undefined
      ? Boolean(req.body.has_german ?? req.body.isGermanActive ?? req.body.hasGerman)
      : Boolean(existing.has_german || existing.isGermanActive);
    const is_persian = (req.body.has_persian ?? req.body.isPersianActive ?? req.body.hasPersian) !== undefined
      ? Boolean(req.body.has_persian ?? req.body.isPersianActive ?? req.body.hasPersian)
      : Boolean(existing.has_persian || existing.isPersianActive);

    const updateResult = await pool.query(
      'UPDATE cafes SET name = $1, slug = $2, username = $3, password_hash = $4, hero_image = $5, "coverImage" = $6, primary_color = $7, accent_color = $8, bg_color = $9, custom_domain = $10, working_hours = $11, maps_url = $12, instagram_url = $13, phone_number = $14, has_english = $15, has_spanish = $16, has_arabic = $17, "isFrenchActive" = $18, has_french = $19, "isPortugueseActive" = $20, has_portuguese = $21, "isRussianActive" = $22, has_russian = $23, "isGermanActive" = $24, has_german = $25, "isPersianActive" = $26, has_persian = $27, campaign_text = $28, campaign_text_en = $29, campaign_text_es = $30, campaign_text_ar = $31, campaign_text_fr = $32, campaign_text_pt = $33, campaign_text_ru = $34, campaign_text_de = $35, campaign_text_fa = $36 WHERE id = $37 RETURNING *',
      [
        finalName,
        finalSlug,
        finalUsername,
        password_hash,
        finalHeroImage, 
        finalCoverImage, 
        finalPrimaryColor, 
        finalAccentColor, 
        finalBgColor, 
        cleanDomainVal, 
        finalWorkingHours,
        finalMapsUrl,
        finalInstagramUrl,
        finalPhoneNumber,
        is_english,
        is_spanish,
        is_arabic,
        is_french,
        is_french,
        is_portuguese,
        is_portuguese,
        is_russian,
        is_russian,
        is_german,
        is_german,
        is_persian,
        is_persian,
        campaign_text !== undefined ? cleanStr(campaign_text) : existing.campaign_text,
        campaign_text_en !== undefined ? cleanStr(campaign_text_en) : existing.campaign_text_en,
        campaign_text_es !== undefined ? cleanStr(campaign_text_es) : existing.campaign_text_es,
        campaign_text_ar !== undefined ? cleanStr(campaign_text_ar) : existing.campaign_text_ar,
        campaign_text_fr !== undefined ? cleanStr(campaign_text_fr) : existing.campaign_text_fr,
        campaign_text_pt !== undefined ? cleanStr(campaign_text_pt) : existing.campaign_text_pt,
        campaign_text_ru !== undefined ? cleanStr(campaign_text_ru) : existing.campaign_text_ru,
        campaign_text_de !== undefined ? cleanStr(campaign_text_de) : existing.campaign_text_de,
        campaign_text_fa !== undefined ? cleanStr(campaign_text_fa) : existing.campaign_text_fa,
        cafeId
      ]
    );

    res.json(sanitizeCafe(updateResult.rows[0], isSuperAdmin));
  } catch (err) {
    console.error("Güncelleme Hatası:", err.message);
    if (err.code === '23505') {
      if (err.detail?.includes('custom_domain') || err.message.includes('custom_domain')) {
        return res.status(400).json({ error: "Bu özel alan adı (custom domain) zaten başka bir kafe tarafından kullanılıyor." });
      }
      if (err.detail?.includes('slug') || err.message.includes('slug')) {
        return res.status(400).json({ error: "Bu sistem linki (slug) zaten başka bir kafe tarafından kullanılıyor." });
      }
      if (err.detail?.includes('username') || err.message.includes('username')) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten başka bir kafe tarafından kullanılıyor." });
      }
      return res.status(400).json({ error: "Girilen bilgilerden biri sistemde zaten kullanılıyor." });
    }
    res.status(500).json({ error: "Kafe ayarları güncellenirken bir sunucu hatası oluştu." });
  }
};

// 7. Kafeyi sil (DELETE) - [KORUMALI - SÜPER ADMİN]
const deleteCafe = async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id, 10);
    if (isNaN(cafeId)) {
      return res.status(400).json({ error: "Geçersiz kafe kimliği." });
    }
    await pool.query('DELETE FROM cafes WHERE id = $1', [cafeId]);
    res.json({ message: "Kafe ve bağlı tüm veriler başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe silinirken hata oluştu." });
  }
};

// 8. Menüyü tek seferde getir (GET /full-menu/:identifier) - (Açık rota)
const getFullMenu = async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = cleanStr(identifier);
    if (!cleanId) {
      return res.status(400).json({ error: "Geçersiz kafe adresi veya alan adı." });
    }

    // www. önekini normalize ederek hem altinbalik.co hem www.altinbalik.co eşleşmesini destekle
    const altDomain = cleanId.toLowerCase().startsWith('www.') ? cleanId.slice(4) : `www.${cleanId}`;

    // 1. Kafeyi bul (Slug veya Custom Domain ile)
    const cafeResult = await pool.query(
      'SELECT * FROM cafes WHERE LOWER(slug) = LOWER($1) OR LOWER(custom_domain) = LOWER($1) OR LOWER(custom_domain) = LOWER($2) LIMIT 1',
      [cleanId, altDomain]
    );

    if (cafeResult.rows.length === 0) {
      return res.status(404).json({ error: "Bu adrese ait bir restoran bulunamadı." });
    }

    const cafe = cafeResult.rows[0];

    // 2. Kafenin kategorilerini sıralı getir
    const categoriesResult = await pool.query(
      'SELECT * FROM categories WHERE cafe_id = $1 ORDER BY order_index ASC, created_at ASC',
      [cafe.id]
    );
    const categories = categoriesResult.rows;

    // 3. Kafeye ait tüm kategorilerin ürünlerini tek bir JOIN ile çek
    const productsResult = await pool.query(
      `SELECT p.* 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE c.cafe_id = $1 
       ORDER BY p.created_at DESC`,
      [cafe.id]
    );

    // Ürünleri kategori ID'sine göre bellekte grupla
    const productsByCategory = {};
    categories.forEach(cat => {
      productsByCategory[cat.id] = [];
    });

    productsResult.rows.forEach(product => {
      if (productsByCategory[product.category_id]) {
        productsByCategory[product.category_id].push(product);
      }
    });

    // Hassas şifre hash'ini ve admin kullanıcı adını istemciye göndermiyoruz
    const safeCafe = sanitizeCafe(cafe, false);

    return res.json({
      cafe: safeCafe,
      categories,
      productsByCategory
    });
  } catch (err) {
    console.error("Full Menu Fetch Hatası:", err.message);
    return res.status(500).json({ error: "Menü verileri yüklenirken sunucu hatası oluştu." });
  }
};

const authController = require('./authController');

module.exports = {
  getAllCafes,
  getCafeById,
  getCafeBySlug,
  getCafeByDomain,
  getFullMenu,
  createCafe,
  updateCafe,
  deleteCafe,
  loginCafe: authController.loginCafe
};
