const pool = require('../config/db');

const getStats = async (req, res) => {
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
};

module.exports = {
  getStats
};
