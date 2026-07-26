const pool = require('../config/db');

// 1. Belirli bir kategorinin tüm ürünlerini getir (GET) - (Açık rota)
const getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC',
      [categoryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürünler listelenirken hata oluştu." });
  }
};

// 2. Yeni ürün ekle (POST) - [KORUMALI]
const createProduct = async (req, res) => {
  try {
    const { category_id, name, name_en, name_es, name_ar, description, description_en, description_es, description_ar, price, image_url, is_active } = req.body;
    const activeStatus = is_active !== undefined ? is_active : true;

    const newProduct = await pool.query(
      'INSERT INTO products (category_id, name, name_en, name_es, name_ar, description, description_en, description_es, description_ar, price, image_url, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [category_id, name, name_en || null, name_es || null, name_ar || null, description || null, description_en || null, description_es || null, description_ar || null, price, image_url || null, activeStatus]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün eklenirken hata oluştu." });
  }
};

// 3. Ürünün aktiflik durumunu değiştir (Stokta Var / Bitti) (PUT) - [KORUMALI]
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; // true veya false
    const updatedProduct = await pool.query(
      'UPDATE products SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün durumu güncellenirken hata oluştu." });
  }
};

// 4. Ürünü tamamen sil (DELETE) - [KORUMALI]
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: "Ürün başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün silinirken hata oluştu." });
  }
};

// 5. Ürün bilgilerini güncelle (PUT) - [KORUMALI]
const updateProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Geçersiz ürün kimliği." });
    }

    const { name, name_en, name_es, name_ar, description, description_en, description_es, description_ar, price, image_url, is_active } = req.body;

    if (!name || price === undefined || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: "Ürün adı ve geçerli bir fiyat zorunludur." });
    }

    let query, params;
    if (is_active !== undefined) {
      query = 'UPDATE products SET name = $1, name_en = $2, name_es = $3, name_ar = $4, description = $5, description_en = $6, description_es = $7, description_ar = $8, price = $9, image_url = $10, is_active = $11 WHERE id = $12 RETURNING *';
      params = [name, name_en || null, name_es || null, name_ar || null, description || null, description_en || null, description_es || null, description_ar || null, parseFloat(price), image_url || null, is_active, productId];
    } else {
      query = 'UPDATE products SET name = $1, name_en = $2, name_es = $3, name_ar = $4, description = $5, description_en = $6, description_es = $7, description_ar = $8, price = $9, image_url = $10 WHERE id = $11 RETURNING *';
      params = [name, name_en || null, name_es || null, name_ar || null, description || null, description_en || null, description_es || null, description_ar || null, parseFloat(price), image_url || null, productId];
    }

    const updatedProduct = await pool.query(query, params);

    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenmek istenen ürün bulunamadı." });
    }

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error("Ürün güncelleme hatası:", err.message);
    res.status(500).json({ error: "Ürün güncellenirken sunucu hatası oluştu." });
  }
};

module.exports = {
  getProductsByCategoryId,
  createProduct,
  toggleProductStatus,
  deleteProduct,
  updateProduct
};
