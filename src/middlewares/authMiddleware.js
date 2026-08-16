const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// JWT Token Doğrulama Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token bulunamadı. Yetkisiz erişim.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token formatı geçersiz. Yetkisiz erişim.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.admin = decoded; // Geriye dönük uyumluluk için

    // Superadmin kontrolü (role = superadmin veya ENV ADMIN_USERNAME ile eşleşen token)
    const isSuperAdmin = decoded.role === 'superadmin' || 
                         (decoded.username && decoded.username === process.env.ADMIN_USERNAME) ||
                         (!decoded.role && decoded.username && decoded.username === process.env.ADMIN_USERNAME);

    if (isSuperAdmin) {
      req.user.role = 'superadmin';
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Geçersiz veya süresi geçmiş token.' });
  }
};

// Multi-Tenant Güvenlik ve Yetki Kontrolü Middleware
const verifyCafeOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Yetkilendirme bilgisi bulunamadı.' });
    }

    // 1. Superadmin Her Kafede İşlem Yapabilir
    if (req.user.role === 'superadmin') {
      return next();
    }

    // 2. Kafe Sahibi (cafe_owner) İçin Kiracı (Tenant) Güvenlik Duvarı
    if (req.user.role === 'cafe_owner') {
      const userCafeId = parseInt(req.user.cafeId, 10);
      if (isNaN(userCafeId)) {
        return res.status(403).json({ error: 'Yetkisiz işlem: Token içindeki kafe kimliği geçersiz.' });
      }

      const baseUrl = req.baseUrl || '';

      // A. Kafe Rotası Güncelleme/Silme Kontrolü (/api/cafes/:id)
      if (req.params.id && baseUrl.includes('/cafes')) {
        const targetCafeId = parseInt(req.params.id, 10);
        if (targetCafeId !== userCafeId) {
          return res.status(403).json({ error: 'Yetkisiz işlem: Başka bir kafenin bilgilerini değiştiremezsiniz.' });
        }
      }

      // B. cafeId Parametresi Kontrolü (/api/.../cafe/:cafeId)
      if (req.params.cafeId) {
        const targetCafeId = parseInt(req.params.cafeId, 10);
        if (targetCafeId !== userCafeId) {
          return res.status(403).json({ error: 'Yetkisiz işlem: Başka bir kafe için işlem yapamazsınız.' });
        }
      }

      // C. Body İçerisindeki cafe_id Kontrolü (Örn: POST /api/categories)
      const bodyCafeId = req.body ? (req.body.cafe_id || req.body.cafeId) : null;
      if (bodyCafeId !== null && bodyCafeId !== undefined) {
        const targetCafeId = parseInt(bodyCafeId, 10);
        if (targetCafeId !== userCafeId) {
          return res.status(403).json({ error: 'Yetkisiz işlem: Başka bir kafe adına veri ekleyemezsiniz.' });
        }
      }

      // D. Kategori İşlemlerinde Aidiyet Kontrolü (/api/categories/:id)
      if (req.params.id && baseUrl.includes('/categories')) {
        const categoryId = parseInt(req.params.id, 10);
        if (!isNaN(categoryId)) {
          const catResult = await pool.query('SELECT cafe_id FROM categories WHERE id = $1 LIMIT 1', [categoryId]);
          if (catResult.rows.length === 0) {
            return res.status(404).json({ error: 'İşlem yapılmak istenen kategori bulunamadı.' });
          }
          if (catResult.rows[0].cafe_id !== userCafeId) {
            return res.status(403).json({ error: 'Yetkisiz işlem: Bu kategoriye erişim izniniz yok.' });
          }
        }
      }

      // E. Ürün İşlemlerinde Aidiyet Kontrolü (/api/products/:id veya /api/products/status/:id)
      if (req.params.id && baseUrl.includes('/products')) {
        const productId = parseInt(req.params.id, 10);
        if (!isNaN(productId)) {
          const prodResult = await pool.query(
            'SELECT c.cafe_id FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1 LIMIT 1',
            [productId]
          );
          if (prodResult.rows.length === 0) {
            return res.status(404).json({ error: 'İşlem yapılmak istenen ürün bulunamadı.' });
          }
          if (prodResult.rows[0].cafe_id !== userCafeId) {
            return res.status(403).json({ error: 'Yetkisiz işlem: Bu ürüne erişim izniniz yok.' });
          }
        }
      }

      // F. Ürün Ekleme İşleminde Kategori Aidiyeti Kontrolü (POST /api/products)
      if (baseUrl.includes('/products') && req.method === 'POST') {
        const categoryId = parseInt(req.body.category_id || req.body.categoryId, 10);
        if (!isNaN(categoryId)) {
          const catResult = await pool.query('SELECT cafe_id FROM categories WHERE id = $1 LIMIT 1', [categoryId]);
          if (catResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün eklenmek istenen kategori bulunamadı.' });
          }
          if (catResult.rows[0].cafe_id !== userCafeId) {
            return res.status(403).json({ error: 'Yetkisiz işlem: Başka kafeye ait bir kategoriye ürün ekleyemezsiniz.' });
          }
        }
      }

      return next();
    }

    return res.status(403).json({ error: 'Yetkisiz işlem: Tanımsız yetki rolü.' });
  } catch (err) {
    console.error("Yetki kontrolü hatası:", err.message);
    return res.status(500).json({ error: 'Yetki kontrolü sırasında bir sunucu hatası oluştu.' });
  }
};

module.exports = {
  verifyToken,
  verifyCafeOwnership
};
