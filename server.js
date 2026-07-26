require('dotenv').config(); // .env dosyasındaki gizli linki okumak için
const express = require('express');
const cors = require('cors');
const path = require('path');

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

const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const whitelist = [
  'https://qr-menu-admin-six.vercel.app',
  'https://qr-menu-musteri.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Mobil uygulamalar veya curl istekleri gibi origin bilgisi olmayan istekler
    if (!origin) return callback(null, true);
    
    // Whitelist veya SaaS sisteminin white-label özel alan adları (localhost/127.0.0.1 içermeyenler)
    if (whitelist.indexOf(origin) !== -1 || (!origin.includes('localhost') && !origin.includes('127.0.0.1'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // Preflight isteklerinde 405 veya 204 yerine 200 OK döner
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ==========================================
// 1. ÖNCE API ROTALARI
// ==========================================

// HEALTH CHECK & TEST ROTALARI
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "Backend ayakta" });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Veritabanı saati sorulur
    res.json({ mesaj: "Veritabanına başarıyla bağlanıldı!", zaman: result.rows[0].now });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: "Veritabanı bağlantı hatası!" });
  }
});

// ROUTE TANIMLAMALARI
const authRoutes = require('./src/routes/authRoutes');
const cafeRoutes = require('./src/routes/cafeRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);

// ==========================================
// 2. SONRA STATİK DOSYALAR (React Build)
// ==========================================
app.use(express.static(path.join(__dirname, 'qr-menu-ui', 'dist')));

// ==========================================
// 3. EN SONA CATCH-ALL (SPA Yönlendirmesi)
// ==========================================
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr-menu-ui', 'dist', 'index.html'));
});

// Global Hata Yakalayıcı Middleware (Error Handler)
app.use((err, req, res, next) => {
  console.error("Global Sunucu Hatası:", err.message || err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: "Sunucuda beklenmedik bir hata oluştu." });
});

// ==========================================
// Sunucuyu Ayaklandırıyoruz
// ==========================================
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda gümbür gümbür çalışıyor...`);
});