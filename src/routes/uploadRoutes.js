const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 5MB Limit ve MIME-Type Güvenlik Filtresi
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabyte
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca JPEG, PNG veya WebP formatındaki görseller yüklenebilir.'), false);
    }
  }
});

// Multer Hatalarını Yakalayan Wrapper Middleware
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Görsel boyutu 5MB sınırını aşamaz.' });
      }
      return res.status(400).json({ success: false, error: `Dosya yükleme hatası: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

// Rota: verifyToken ile korunur
router.post('/', verifyToken, handleUploadMiddleware, uploadController.uploadImage);

module.exports = router;
