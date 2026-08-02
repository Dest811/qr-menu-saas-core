const pool = require('../config/db');

// 1. Belirli bir kategorinin tüm ürünlerini getir (GET) - (Açık rota)
const getProductsByCategoryId = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori kimliği." });
    }
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
    const { 
      category_id, 
      name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa,
      description, description_en, description_es, description_ar, description_fr, description_pt, description_ru, description_de, description_fa,
      price, image_url, is_active 
    } = req.body;

    const parsedCategoryId = parseInt(category_id, 10);
    if (isNaN(parsedCategoryId) || !name || price === undefined || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: "Geçersiz kategori kimliği, ürün adı veya fiyat." });
    }
    const activeStatus = is_active !== undefined ? Boolean(is_active) : true;

    const newProduct = await pool.query(
      'INSERT INTO products (category_id, name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa, description, description_en, description_es, description_ar, description_fr, description_pt, description_ru, description_de, description_fa, price, image_url, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *',
      [
        parsedCategoryId, 
        name.trim(), 
        name_en || null, name_es || null, name_ar || null, name_fr || null, name_pt || null, name_ru || null, name_de || null, name_fa || null,
        description || null, description_en || null, description_es || null, description_ar || null, description_fr || null, description_pt || null, description_ru || null, description_de || null, description_fa || null,
        parseFloat(price), 
        image_url || null, 
        activeStatus
      ]
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
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Geçersiz ürün kimliği." });
    }
    const { is_active } = req.body; // true veya false
    const updatedProduct = await pool.query(
      'UPDATE products SET is_active = $1 WHERE id = $2 RETURNING *',
      [Boolean(is_active), productId]
    );
    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek ürün bulunamadı." });
    }
    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün durumu güncellenirken hata oluştu." });
  }
};

// 4. Ürünü tamamen sil (DELETE) - [KORUMALI]
const deleteProduct = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Geçersiz ürün kimliği." });
    }
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
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

    const { 
      name, name_en, name_es, name_ar, name_fr, name_pt, name_ru, name_de, name_fa,
      description, description_en, description_es, description_ar, description_fr, description_pt, description_ru, description_de, description_fa,
      price, image_url, is_active 
    } = req.body;

    if (!name || price === undefined || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: "Ürün adı ve geçerli bir fiyat zorunludur." });
    }

    let query, params;
    if (is_active !== undefined) {
      query = 'UPDATE products SET name = $1, name_en = $2, name_es = $3, name_ar = $4, name_fr = $5, name_pt = $6, name_ru = $7, name_de = $8, name_fa = $9, description = $10, description_en = $11, description_es = $12, description_ar = $13, description_fr = $14, description_pt = $15, description_ru = $16, description_de = $17, description_fa = $18, price = $19, image_url = $20, is_active = $21 WHERE id = $22 RETURNING *';
      params = [
        name, name_en || null, name_es || null, name_ar || null, name_fr || null, name_pt || null, name_ru || null, name_de || null, name_fa || null,
        description || null, description_en || null, description_es || null, description_ar || null, description_fr || null, description_pt || null, description_ru || null, description_de || null, description_fa || null,
        parseFloat(price), image_url || null, is_active, productId
      ];
    } else {
      query = 'UPDATE products SET name = $1, name_en = $2, name_es = $3, name_ar = $4, name_fr = $5, name_pt = $6, name_ru = $7, name_de = $8, name_fa = $9, description = $10, description_en = $11, description_es = $12, description_ar = $13, description_fr = $14, description_pt = $15, description_ru = $16, description_de = $17, description_fa = $18, price = $19, image_url = $20 WHERE id = $21 RETURNING *';
      params = [
        name, name_en || null, name_es || null, name_ar || null, name_fr || null, name_pt || null, name_ru || null, name_de || null, name_fa || null,
        description || null, description_en || null, description_es || null, description_ar || null, description_fr || null, description_pt || null, description_ru || null, description_de || null, description_fa || null,
        parseFloat(price), image_url || null, productId
      ];
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
