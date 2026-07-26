const jwt = require('jsonwebtoken');

const login = (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return res.status(500).json({ error: 'ADMIN_USERNAME veya ADMIN_PASSWORD environment değişkenleri tanımlanmamış!' });
    }

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
