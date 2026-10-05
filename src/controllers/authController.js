const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Güvenli Cookie Konfigürasyonu (XSS Koruması)
const getCookieOptions = (req) => {
  const isProduction = process.env.NODE_ENV === 'production' || (req && req.hostname && !req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
  return {
    httpOnly: true, // XSS ile JavaScript tarafından okunamaz
    secure: isProduction, // HTTPS zorunlu (prod veya remote ortamda)
    sameSite: isProduction ? 'none' : 'lax', // Cross-origin (Vercel -> Render) için production'da none
    maxAge: 24 * 60 * 60 * 1000 // 24 Saat
  };
};

// Kafe Sahibi Giriş Metodu (loginCafe)
const loginCafe = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunludur." });
    }

    const result = await pool.query(
      'SELECT * FROM cafes WHERE username = $1 LIMIT 1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı!" });
    }

    const cafe = result.rows[0];

    if (!cafe.password_hash) {
      return res.status(401).json({ error: "Bu kafe hesabına henüz şifre tanımlanmamıştır." });
    }

    const isMatch = await bcrypt.compare(password.trim(), cafe.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı!" });
    }

    const payload = {
      cafeId: cafe.id,
      role: 'cafe_owner',
      username: cafe.username,
      slug: cafe.slug
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // HttpOnly Cookie olarak da set ediyoruz (XSS Koruması)
    res.cookie('adminToken', token, getCookieOptions(req));

    // Hassas şifre hash alanını istemciye dönmemek için çıkarıyoruz
    const { password_hash, ...safeCafe } = cafe;

    return res.status(200).json({
      success: true,
      token, // Fallback uyumluluğu için JSON içinde de dönülür
      role: 'cafe_owner',
      cafe: safeCafe
    });
  } catch (err) {
    console.error("Kafe Giriş Hatası:", err.message);
    return res.status(500).json({ error: "Giriş yapılırken sunucu hatası oluştu." });
  }
};

// Genel Giriş Metodu (Superadmin & Kafe Sahibi Uyumlu)
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    // 1. Superadmin Kontrolü
    if (adminUser && adminPass && username === adminUser && password === adminPass) {
      const token = jwt.sign(
        { username, role: 'superadmin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // HttpOnly Cookie olarak set ediyoruz
      res.cookie('adminToken', token, getCookieOptions(req));

      return res.status(200).json({ 
        success: true, 
        token, 
        role: 'superadmin' 
      });
    }

    // 2. Kafe Sahibi Kontrolü (Superadmin eşleşmediyse)
    return await loginCafe(req, res);
  } catch (err) {
    console.error("Giriş Hatası:", err.message);
    return res.status(500).json({ error: "Giriş yapılırken sunucu hatası oluştu." });
  }
};

// Çıkış Metodu (Cookie temizleme)
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || (req && req.hostname && !req.hostname.includes('localhost') && !req.hostname.includes('127.0.0.1'));
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  return res.status(200).json({ success: true, message: "Başarıyla çıkış yapıldı." });
};

module.exports = {
  login,
  loginCafe,
  logout
};
