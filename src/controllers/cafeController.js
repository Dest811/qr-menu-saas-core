const pool = require('../config/db');

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
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cafes WHERE id = $1 LIMIT 1', [id]);
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
    const result = await pool.query('SELECT * FROM cafes WHERE slug = $1 LIMIT 1', [slug]);
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
    const result = await pool.query('SELECT * FROM cafes WHERE custom_domain = $1 LIMIT 1', [domainName]);
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
  const { name, slug, logo_url, hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa } = req.body;
  const coverImage = req.body.coverImage !== undefined ? req.body.coverImage : req.body.cover_image;
  const finalMapsUrl = maps_url !== undefined ? maps_url : req.body.Maps_url;

  // Esnek dil kontrolü (has_english / isEnglishActive / hasEnglish vb.)
  const has_english = req.body.has_english !== undefined 
    ? req.body.has_english 
    : (req.body.isEnglishActive !== undefined ? req.body.isEnglishActive : (req.body.hasEnglish !== undefined ? req.body.hasEnglish : false));

  const has_spanish = req.body.has_spanish !== undefined 
    ? req.body.has_spanish 
    : (req.body.isSpanishActive !== undefined ? req.body.isSpanishActive : (req.body.hasSpanish !== undefined ? req.body.hasSpanish : false));

  const has_arabic = req.body.has_arabic !== undefined 
    ? req.body.has_arabic 
    : (req.body.isArabicActive !== undefined ? req.body.isArabicActive : (req.body.hasArabic !== undefined ? req.body.hasArabic : false));

  const has_french = req.body.has_french !== undefined 
    ? req.body.has_french 
    : (req.body.isFrenchActive !== undefined ? req.body.isFrenchActive : (req.body.hasFrench !== undefined ? req.body.hasFrench : false));

  const has_portuguese = req.body.has_portuguese !== undefined 
    ? req.body.has_portuguese 
    : (req.body.isPortugueseActive !== undefined ? req.body.isPortugueseActive : (req.body.hasPortuguese !== undefined ? req.body.hasPortuguese : false));

  const has_russian = req.body.has_russian !== undefined 
    ? req.body.has_russian 
    : (req.body.isRussianActive !== undefined ? req.body.isRussianActive : (req.body.hasRussian !== undefined ? req.body.hasRussian : false));

  const has_german = req.body.has_german !== undefined 
    ? req.body.has_german 
    : (req.body.isGermanActive !== undefined ? req.body.isGermanActive : (req.body.hasGerman !== undefined ? req.body.hasGerman : false));

  const has_persian = req.body.has_persian !== undefined 
    ? req.body.has_persian 
    : (req.body.isPersianActive !== undefined ? req.body.isPersianActive : (req.body.hasPersian !== undefined ? req.body.hasPersian : false));

  try {
    const newCafe = await pool.query(
      'INSERT INTO cafes (name, slug, logo_url, hero_image, "coverImage", primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, has_english, has_spanish, has_arabic, "isFrenchActive", has_french, "isPortugueseActive", has_portuguese, "isRussianActive", has_russian, "isGermanActive", has_german, "isPersianActive", has_persian, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35) RETURNING *',
      [
        name, 
        slug, 
        logo_url || null, 
        hero_image || null, 
        coverImage || null,
        primary_color || null, 
        accent_color || null, 
        bg_color || null, 
        custom_domain || null,
        working_hours || null,
        finalMapsUrl || null,
        instagram_url || null,
        phone_number || null,
        Boolean(has_english),
        Boolean(has_spanish),
        Boolean(has_arabic),
        Boolean(has_french),
        Boolean(has_french),
        Boolean(has_portuguese),
        Boolean(has_portuguese),
        Boolean(has_russian),
        Boolean(has_russian),
        Boolean(has_german),
        Boolean(has_german),
        Boolean(has_persian),
        Boolean(has_persian),
        campaign_text || null,
        campaign_text_en || null,
        campaign_text_es || null,
        campaign_text_ar || null,
        campaign_text_fr || null,
        campaign_text_pt || null,
        campaign_text_ru || null,
        campaign_text_de || null,
        campaign_text_fa || null
      ]
    );
    res.json(newCafe.rows[0]);
  } catch (err) {
    console.error("Kafe oluşturma hatası:", err.message);
    res.status(500).json({ error: "Kafe eklenirken bir hata oluştu: " + err.message });
  }
};

// 6. Kafeyi Güncelle (PUT) - [KORUMALI]
const updateCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en, campaign_text_es, campaign_text_ar, campaign_text_fr, campaign_text_pt, campaign_text_ru, campaign_text_de, campaign_text_fa } = req.body;
    const coverImage = req.body.coverImage !== undefined ? req.body.coverImage : req.body.cover_image;
    const finalMapsUrl = maps_url !== undefined ? maps_url : req.body.Maps_url;
    
    // Esnek dil kontrolü (has_english / isEnglishActive / hasEnglish vb.)
    const has_english = req.body.has_english !== undefined 
      ? req.body.has_english 
      : (req.body.isEnglishActive !== undefined ? req.body.isEnglishActive : (req.body.hasEnglish !== undefined ? req.body.hasEnglish : false));

    const has_spanish = req.body.has_spanish !== undefined 
      ? req.body.has_spanish 
      : (req.body.isSpanishActive !== undefined ? req.body.isSpanishActive : (req.body.hasSpanish !== undefined ? req.body.hasSpanish : false));

    const has_arabic = req.body.has_arabic !== undefined 
      ? req.body.has_arabic 
      : (req.body.isArabicActive !== undefined ? req.body.isArabicActive : (req.body.hasArabic !== undefined ? req.body.hasArabic : false));

    const has_french = req.body.has_french !== undefined 
      ? req.body.has_french 
      : (req.body.isFrenchActive !== undefined ? req.body.isFrenchActive : (req.body.hasFrench !== undefined ? req.body.hasFrench : false));

    const has_portuguese = req.body.has_portuguese !== undefined 
      ? req.body.has_portuguese 
      : (req.body.isPortugueseActive !== undefined ? req.body.isPortugueseActive : (req.body.hasPortuguese !== undefined ? req.body.hasPortuguese : false));

    const has_russian = req.body.has_russian !== undefined 
      ? req.body.has_russian 
      : (req.body.isRussianActive !== undefined ? req.body.isRussianActive : (req.body.hasRussian !== undefined ? req.body.hasRussian : false));

    const has_german = req.body.has_german !== undefined 
      ? req.body.has_german 
      : (req.body.isGermanActive !== undefined ? req.body.isGermanActive : (req.body.hasGerman !== undefined ? req.body.hasGerman : false));

    const has_persian = req.body.has_persian !== undefined 
      ? req.body.has_persian 
      : (req.body.isPersianActive !== undefined ? req.body.isPersianActive : (req.body.hasPersian !== undefined ? req.body.hasPersian : false));

    const updateResult = await pool.query(
      'UPDATE cafes SET hero_image = $1, "coverImage" = $2, primary_color = $3, accent_color = $4, bg_color = $5, custom_domain = $6, working_hours = $7, maps_url = $8, instagram_url = $9, phone_number = $10, has_english = $11, has_spanish = $12, has_arabic = $13, "isFrenchActive" = $14, has_french = $15, "isPortugueseActive" = $16, has_portuguese = $17, "isRussianActive" = $18, has_russian = $19, "isGermanActive" = $20, has_german = $21, "isPersianActive" = $22, has_persian = $23, campaign_text = $24, campaign_text_en = $25, campaign_text_es = $26, campaign_text_ar = $27, campaign_text_fr = $28, campaign_text_pt = $29, campaign_text_ru = $30, campaign_text_de = $31, campaign_text_fa = $32 WHERE id = $33 RETURNING *',
      [
        hero_image || null, 
        coverImage || null, 
        primary_color || null, 
        accent_color || null, 
        bg_color || null, 
        custom_domain || null, 
        working_hours || null,
        finalMapsUrl || null,
        instagram_url || null,
        phone_number || null,
        Boolean(has_english),
        Boolean(has_spanish),
        Boolean(has_arabic),
        Boolean(has_french),
        Boolean(has_french),
        Boolean(has_portuguese),
        Boolean(has_portuguese),
        Boolean(has_russian),
        Boolean(has_russian),
        Boolean(has_german),
        Boolean(has_german),
        Boolean(has_persian),
        Boolean(has_persian),
        campaign_text || null,
        campaign_text_en || null,
        campaign_text_es || null,
        campaign_text_ar || null,
        campaign_text_fr || null,
        campaign_text_pt || null,
        campaign_text_ru || null,
        campaign_text_de || null,
        campaign_text_fa || null,
        id
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek kafe bulunamadı." });
    }
    
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("Güncelleme Hatası:", err.message);
    res.status(500).json({ error: "Kafe ayarları güncellenemedi: " + err.message });
  }
};

// 7. Kafeyi sil (DELETE) - [KORUMALI]
const deleteCafe = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cafes WHERE id = $1', [id]);
    res.json({ message: "Kafe ve bağlı tüm veriler başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe silinirken hata oluştu." });
  }
};

module.exports = {
  getAllCafes,
  getCafeById,
  getCafeBySlug,
  getCafeByDomain,
  createCafe,
  updateCafe,
  deleteCafe
};
