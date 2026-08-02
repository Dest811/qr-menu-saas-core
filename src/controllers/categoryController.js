const pool = require('../config/db');

// 1. Belirli bir kafenin tüm kategorilerini getir (GET) - (Açık rota)
const getCategoriesByCafeId = async (req, res) => {
  try {
    const cafeId = parseInt(req.params.cafeId, 10);
    if (isNaN(cafeId)) {
      return res.status(400).json({ error: "Geçersiz kafe kimliği." });
    }
    const result = await pool.query(
      'SELECT * FROM categories WHERE cafe_id = $1 ORDER BY order_index ASC, created_at ASC',
      [cafeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategoriler yüklenirken hata oluştu." });
  }
};

// 2. Yeni kategori ekle (POST) - [KORUMALI]
const createCategory = async (req, res) => {
  try {
    const { cafe_id, name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa, order_index } = req.body;
    const parsedCafeId = parseInt(cafe_id, 10);
    if (isNaN(parsedCafeId) || !name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: "Geçersiz kafe kimliği veya boş kategori adı." });
    }

    const newCategory = await pool.query(
      'INSERT INTO categories (cafe_id, name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [parsedCafeId, name.trim(), name_en || null, name_es || null, name_ar || null, name_fr || null, name_pt || null, name_ru || null, name_de || null, name_fa || null, parseInt(order_index, 10) || 0]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori eklenirken hata oluştu." });
  }
};

// 3. Kategoriyi güncelle (PUT) - [KORUMALI]
const updateCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori kimliği." });
    }
    const { name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa, order_index } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: "Kategori adı boş bırakılamaz." });
    }

    const updatedCategory = await pool.query(
      'UPDATE categories SET name = $1, name_en = $2, name_es = $3, name_ar = $4, name_fr = $5, name_pt = $6, name_ru = $7, name_de = $8, name_fa = $9, order_index = $10 WHERE id = $11 RETURNING *',
      [name.trim(), name_en || null, name_es || null, name_ar || null, name_fr || null, name_pt || null, name_ru || null, name_de || null, name_fa || null, parseInt(order_index, 10) || 0, categoryId]
    );
    if (updatedCategory.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek kategori bulunamadı." });
    }
    res.json(updatedCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori güncellenirken hata oluştu." });
  }
};

// 4. Kategoriyi sil (DELETE) - [KORUMALI]
const deleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori kimliği." });
    }
    await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    res.json({ message: "Kategori başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori silinirken hata oluştu." });
  }
};

module.exports = {
  getCategoriesByCafeId,
  createCategory,
  updateCategory,
  deleteCategory
};
