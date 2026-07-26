const jwt = require('jsonwebtoken');

const login = (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUser && password === adminPass) {
      // 24 saat geçerli JWT token üretiyoruz
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({ success: true, token });
    }

    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı!' });
  } catch (err) {
    console.error("Giriş Hatası:", err.message);
    return res.status(500).json({ error: "Giriş yapılırken sunucu hatası oluştu." });
  }
};

module.exports = {
  login,
};
