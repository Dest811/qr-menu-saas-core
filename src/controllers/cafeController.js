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
  const { name, slug, logo_url, hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en } = req.body;
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

  try {
    const newCafe = await pool.query(
      'INSERT INTO cafes (name, slug, logo_url, hero_image, "coverImage", primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, has_english, has_spanish, has_arabic, campaign_text, campaign_text_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
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
        campaign_text || null,
        campaign_text_en || null
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
    const { hero_image, primary_color, accent_color, bg_color, custom_domain, working_hours, maps_url, instagram_url, phone_number, campaign_text, campaign_text_en } = req.body;
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

    const updateResult = await pool.query(
      'UPDATE cafes SET hero_image = $1, "coverImage" = $2, primary_color = $3, accent_color = $4, bg_color = $5, custom_domain = $6, working_hours = $7, maps_url = $8, instagram_url = $9, phone_number = $10, has_english = $11, has_spanish = $12, has_arabic = $13, campaign_text = $14, campaign_text_en = $15 WHERE id = $16 RETURNING *',
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
        campaign_text || null,
        campaign_text_en || null,
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
