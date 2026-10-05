require('dotenv').config(); // .env dosyasındaki gizli linki okumak için
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

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

// ==========================================
// 1. STATİK VE DİNAMİK CORS YAPILANDIRMASI
// ==========================================
const staticWhitelist = [
  'https://qr-menu-admin-six.vercel.app',
  'https://qr-menu-musteri.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

// Veritabanındaki özel alan adlarını (custom domain) 2 dakikalık periyotla önbelleğe alır
let customDomainCache = new Set();
let lastCacheUpdate = 0;

async function isCustomDomainAllowed(hostname) {
  const now = Date.now();
  if (now - lastCacheUpdate > 120000) { // 2 dakika cache
    try {
      const result = await pool.query("SELECT custom_domain FROM cafes WHERE custom_domain IS NOT NULL AND custom_domain != ''");
      customDomainCache = new Set(result.rows.map(r => r.custom_domain.toLowerCase().trim()));
      lastCacheUpdate = now;
    } catch (e) {
      console.error("CORS Custom domain cache hatası:", e.message);
    }
  }
  return customDomainCache.has(hostname.toLowerCase().trim());
}

const corsOptions = {
  origin: async function (origin, callback) {
    // Mobil uygulamalar, server-to-server ve Postman gibi Origin başlığı olmayan istekler
    if (!origin) return callback(null, true);

    // 1. Statik Whitelist Kontrolü
    if (staticWhitelist.includes(origin)) {
      return callback(null, true);
    }

    try {
      const parsedUrl = new URL(origin);
      const hostname = parsedUrl.hostname.toLowerCase();

      // 2. Vercel Preview Deployments (Örn: qr-menu-admin-*.vercel.app)
      if (hostname.endsWith('.vercel.app') && (hostname.startsWith('qr-menu-') || hostname.includes('qr-menu'))) {
        return callback(null, true);
      }

      // 3. Veritabanında Kayıtlı White-Label Custom Domain Kontrolü
      const isAllowedDomain = await isCustomDomainAllowed(hostname);
      if (isAllowedDomain) {
        return callback(null, true);
      }
    } catch (err) {
      // Geçersiz origin url formatı
    }

    // Eşleşmeyen tüm diğer dış kaynaklı domainler engellenir
    return callback(new Error('CORS Politikası: Bu kaynağa erişim yetkiniz yok.'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

// ==========================================
// 2. RATE LIMITING (BRUTE-FORCE & DDOS KORUMASI)
// ==========================================
// Genel API Limiti: 15 dakikada IP başına 300 istek (Meşru menü gezintisini engellemez)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin." }
});

// Sıkı Login Limiti: 15 dakikada en fazla 10 deneme (Brute-Force ve Bcrypt kilitlenmesini önler)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla hatalı giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." }
});

app.use('/api/', globalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/cafe-login', authLimiter);
app.use('/api/cafes/login', authLimiter);

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