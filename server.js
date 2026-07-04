require('dotenv').config(); // .env dosyasındaki gizli linki okumak için
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Veritabanı ve JWT şifrelerinin doğrulanması (Pre-flight Check)
if (!process.env.DATABASE_URL) {
  console.error("KRİTİK HATA: DATABASE_URL environment değişkeni tanımlanmamış!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("KRİTİK HATA: JWT_SECRET environment değişkeni tanımlanmamış!");
  process.exit(1);
}

const allowedOrigins = [
  'https://qr-menu-admin-six.vercel.app',
  'https://qr-menu-musteri.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Mobil uygulamalar veya curl istekleri gibi origin bilgisi olmayan istekler
    if (!origin) return callback(null, true);
    
    // Belirlenmiş originler veya SaaS sisteminin white-label özel alan adları (localhost/127.0.0.1 içermeyenler)
    if (allowedOrigins.indexOf(origin) !== -1 || (!origin.includes('localhost') && !origin.includes('127.0.0.1'))) {
      callback(null, true);
    } else {
      callback(new Error('CORS politikanız bu isteğe izin vermiyor.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Veritabanı (Supabase) Bağlantısını Kuruyoruz
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT Doğrulama Middleware'i (Korumalı Rotalar İçin)
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
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Geçersiz veya süresi geçmiş token.' });
  }
};

// TEST ROTASI: Tarayıcıdan sunucuya girince göreceğimiz mesaj
app.get('/', (req, res) => {
  res.send('QR Menü SaaS Backend Sistemi Harika Çalışıyor!');
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "Backend ayakta" });
});

// TEST BAĞLANTISI ROTOSU
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Veritabanı saati sorulur
    res.json({ mesaj: "Veritabanına başarıyla bağlanıldı!", zaman: result.rows[0].now });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: "Veritabanı bağlantı hatası!" });
  }
});

// ==========================================
// AUTHENTICATION / GİRİŞ ROTALARI (JWT AUTH)
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    // 24 saat geçerli JWT token üretiyoruz
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token });
  }

  return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı!' });
});

// ==========================================
// CAFE / KAFE ROTALARI
// ==========================================

// 1. Tüm kafeleri getir (GET) - Admin panelinde listelemek için (Açık rota)
app.get('/api/cafes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cafes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafeler listelenirken sunucu hatası oluştu." });
  }
});

// 2. ID'ye göre tekil kafe getir (GET) - (Açık rota)
app.get('/api/cafes/:id', async (req, res) => {
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
});

// 3. Slug'a göre tekil kafe getir (GET) - (Açık rota)
app.get('/api/cafes/slug/:slug', async (req, res) => {
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
});

// 4. Custom Domain'e göre tekil kafe getir (GET) - (Açık rota)
app.get('/api/cafes/domain/:domainName', async (req, res) => {
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
});

// 5. Yeni kafe ekleme (POST) - [KORUMALI]
app.post('/api/cafes', verifyToken, async (req, res) => {
  const { name, slug, logo_url, hero_image, primary_color, accent_color, bg_color, custom_domain } = req.body;
  try {
    const newCafe = await pool.query(
      'INSERT INTO cafes (name, slug, logo_url, hero_image, primary_color, accent_color, bg_color, custom_domain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        name, 
        slug, 
        logo_url || null, 
        hero_image || null, 
        primary_color || null, 
        accent_color || null, 
        bg_color || null, 
        custom_domain || null
      ]
    );
    res.json(newCafe.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe eklenirken bir hata oluştu." });
  }
});

// 6. Kafeyi Güncelle (PUT) - [KORUMALI]
app.put('/api/cafes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hero_image, primary_color, accent_color, bg_color, custom_domain } = req.body;
    
    const updateCafe = await pool.query(
      'UPDATE cafes SET hero_image = $1, primary_color = $2, accent_color = $3, bg_color = $4, custom_domain = $5 WHERE id = $6 RETURNING *',
      [hero_image || null, primary_color || null, accent_color || null, bg_color || null, custom_domain || null, id]
    );
    res.json(updateCafe.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe ayarları güncellenemedi." });
  }
});

// 7. Kafeyi sil (DELETE) - [KORUMALI]
app.delete('/api/cafes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cafes WHERE id = $1', [id]);
    res.json({ message: "Kafe ve bağlı tüm veriler başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kafe silinirken hata oluştu." });
  }
});

// ==========================================
// KATEGORİ ROTALARI (CATEGORIES)
// ==========================================

// 1. Belirli bir kafenin tüm kategorilerini getir (GET) - (Açık rota)
app.get('/api/categories/:cafeId', async (req, res) => {
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
});

// 2. Yeni kategori ekle (POST) - [KORUMALI]
app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { cafe_id, name, order_index } = req.body;
    const newCategory = await pool.query(
      'INSERT INTO categories (cafe_id, name, order_index) VALUES ($1, $2, $3) RETURNING *',
      [cafe_id, name, order_index || 0]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori eklenirken hata oluştu." });
  }
});

// 3. Kategoriyi sil (DELETE) - [KORUMALI]
app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: "Kategori başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Kategori silinirken hata oluştu." });
  }
});

// ==========================================
// ÜRÜN ROTALARI (PRODUCTS)
// ==========================================

// 1. Belirli bir kategorinin tüm ürünlerini getir (GET) - (Açık rota)
app.get('/api/products/:categoryId', async (req, res) => {
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
});

// 2. Yeni ürün ekle (POST) - [KORUMALI]
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { category_id, name, description, price, image_url, is_active } = req.body;
    const activeStatus = is_active !== undefined ? is_active : true;

    const newProduct = await pool.query(
      'INSERT INTO products (category_id, name, description, price, image_url, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [category_id, name, description || null, price, image_url || null, activeStatus]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün eklenirken hata oluştu." });
  }
});

// 3. Ürünün aktiflik durumunu değiştir (Stokta Var / Bitti) (PUT) - [KORUMALI]
app.put('/api/products/:id/toggle', verifyToken, async (req, res) => {
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
});

// 4. Ürünü tamamen sil (DELETE) - [KORUMALI]
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: "Ürün başarıyla silindi!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Ürün silinirken hata oluştu." });
  }
});

// 5. Ürün bilgilerini güncelle (PUT) - [KORUMALI]
app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Geçersiz ürün kimliği." });
    }

    const { name, description, price, image_url, is_active } = req.body;

    if (!name || price === undefined || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: "Ürün adı ve geçerli bir fiyat zorunludur." });
    }

    // Basit ve temiz güncelleme sorgusu (is_active isteğe bağlı)
    let query, params;
    if (is_active !== undefined) {
      query = 'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, is_active = $5 WHERE id = $6 RETURNING *';
      params = [name, description || null, parseFloat(price), image_url || null, is_active, productId];
    } else {
      query = 'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5 RETURNING *';
      params = [name, description || null, parseFloat(price), image_url || null, productId];
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
});

// ==========================================
// İSTATİSTİK ROTALARI (Açık Rota)
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const cafesCount = await pool.query('SELECT COUNT(*) FROM cafes');
    const productsCount = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    res.json({
      totalCafes: parseInt(cafesCount.rows[0].count),
      totalActiveProducts: parseInt(productsCount.rows[0].count)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "İstatistikler yüklenirken hata oluştu." });
  }
});

// ==========================================
// Sunucuyu Ayaklandırıyoruz
// ==========================================
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda gümbür gümbür çalışıyor...`);
});