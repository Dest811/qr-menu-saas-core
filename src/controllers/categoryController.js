const pool = require('../config/db');

// 1. Belirli bir kafenin tüm kategorilerini getir (GET) - (Açık rota)
const getCategoriesByCafeId = async (req, res) => {
  try {
    const { cafeId } = req.params;
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
    const { cafe_id, name, name_en, order_index } = req.body;
    const newCategory = await pool.query(
      'INSERT INTO categories (cafe_id, name, name_en, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [cafe_id, name, name_en || null, order_index || 0]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori eklenirken hata oluştu." });
  }
};

// 3. Kategoriyi sil (DELETE) - [KORUMALI]
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: "Kategori başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori silinirken hata oluştu." });
  }
};

module.exports = {
  getCategoriesByCafeId,
  createCategory,
  deleteCategory
};
