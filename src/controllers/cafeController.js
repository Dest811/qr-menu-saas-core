const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Boş metin (whitespace / empty string) sanitizasyonu için yardımcı fonksiyon
const cleanStr = (val) => (val && typeof val === 'string' && val.trim() !== '') ? val.trim() : null;

// 1. Tüm kafeleri getir (GET) - Admin panelinde listelemek için (Açık rota)
const getAllCafes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cafes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafeler listelenirken sunucu hatası oluştu." });
  }
};

// 2. ID'ye göre tekil kafe getir (GET) - (Açık rota)
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe bilgisi alınırken sunucu hatası oluştu." });
  }
};

// 3. Slug'a göre tekil kafe getir (GET) - (Açık rota)
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe bilgisi alınırken sunucu hatası oluştu." });
  }
};

// 4. Custom Domain'e göre tekil kafe getir (GET) - (Açık rota)
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Domain eşleştirmesi yapılırken sunucu hatası oluştu." });
  }
};

// 5. Yeni kafe ekleme (POST) - [KORUMALI]
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

  const coverImage = cleanStr(req.body.coverImage ?? req.body.cover_image);
  const finalMapsUrl = cleanStr(maps_url ?? req.body.Maps_url);

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
        cleanStr(logo_url), 
        cleanStr(hero_image), 
        coverImage,
        cleanStr(primary_color), 
        cleanStr(accent_color), 
        cleanStr(bg_color), 
        cleanDomainVal,
        cleanStr(working_hours),
        finalMapsUrl,
        cleanStr(instagram_url),
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
    res.json(newCafe.rows[0]);
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
    res.status(500).json({ error: "Kafe eklenirken bir hata oluştu: " + err.message });
  }
};

// 6. Kafeyi Güncelle (PUT) - [KORUMALI]
const updateCafe = async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id, 10);
    if (isNaN(cafeId)) {
      return res.status(400).json({ error: "Geçersiz kafe kimliği." });
    }

    const { username, password, hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa } = req.body;
    
    const finalUsername = cleanStr(username);
    const cleanDomainVal = cleanStr(custom_domain);

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

    if (req.body.slug && cleanStr(req.body.slug)) {
      const cleanSlug = cleanStr(req.body.slug);
      const slugCheck = await pool.query(
        'SELECT id FROM cafes WHERE LOWER(slug) = LOWER($1) AND id != $2 LIMIT 1',
        [cleanSlug, cafeId]
      );
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ error: "Bu sistem linki (slug) zaten başka bir kafe tarafından kullanılıyor." });
      }
    }

    let password_hash = null;
    if (password && password.trim()) {
      password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const coverImage = cleanStr(req.body.coverImage ?? req.body.cover_image);
    const finalMapsUrl = cleanStr(maps_url ?? req.body.Maps_url);
    
    // Esnek dil kontrolü
    const is_english = Boolean(req.body.has_english ?? req.body.isEnglishActive ?? req.body.hasEnglish ?? false);
    const is_spanish = Boolean(req.body.has_spanish ?? req.body.isSpanishActive ?? req.body.hasSpanish ?? false);
    const is_arabic = Boolean(req.body.has_arabic ?? req.body.isArabicActive ?? req.body.hasArabic ?? false);
    const is_french = Boolean(req.body.has_french ?? req.body.isFrenchActive ?? req.body.hasFrench ?? false);
    const is_portuguese = Boolean(req.body.has_portuguese ?? req.body.isPortugueseActive ?? req.body.hasPortuguese ?? false);
    const is_russian = Boolean(req.body.has_russian ?? req.body.isRussianActive ?? req.body.hasRussian ?? false);
    const is_german = Boolean(req.body.has_german ?? req.body.isGermanActive ?? req.body.hasGerman ?? false);
    const is_persian = Boolean(req.body.has_persian ?? req.body.isPersianActive ?? req.body.hasPersian ?? false);

    const updateResult = await pool.query(
      'UPDATE cafes SET username = COALESCE($1, username), password_hash = COALESCE($2, password_hash), hero_image = $3, "coverImage" = $4, primary_color = $5, accent_color = $6, bg_color = $7, custom_domain = $8, working_hours = $9, maps_url = $10, instagram_url = $11, phone_number = $12, has_english = $13, has_spanish = $14, has_arabic = $15, "isFrenchActive" = $16, has_french = $17, "isPortugueseActive" = $18, has_portuguese = $19, "isRussianActive" = $20, has_russian = $21, "isGermanActive" = $22, has_german = $23, "isPersianActive" = $24, has_persian = $25, campaign_text = $26, campaign_text_en = $27, campaign_text_es = $28, campaign_text_ar = $29, campaign_text_fr = $30, campaign_text_pt = $31, campaign_text_ru = $32, campaign_text_de = $33, campaign_text_fa = $34 WHERE id = $35 RETURNING *',
      [
        finalUsername,
        password_hash,
        cleanStr(hero_image), 
        coverImage, 
        cleanStr(primary_color), 
        cleanStr(accent_color), 
        cleanStr(bg_color), 
        cleanDomainVal, 
        cleanStr(working_hours),
        finalMapsUrl,
        cleanStr(instagram_url),
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
        cleanStr(campaign_text_fa),
        cafeId
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek kafe bulunamadı." });
    }
    
    res.json(updateResult.rows[0]);
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
    res.status(500).json({ error: "Kafe ayarları güncellenemedi: " + err.message });
  }
};

// 7. Kafeyi sil (DELETE) - [KORUMALI]
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

const authController = require('./authController');

module.exports = {
  getAllCafes,
  getCafeById,
  getCafeBySlug,
  getCafeByDomain,
  createCafe,
  updateCafe,
  deleteCafe,
  loginCafe: authController.loginCafe
};
