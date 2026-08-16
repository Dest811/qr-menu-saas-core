const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Superadmin veya Kafe Sahibi Girişi (Ortak Rota)
router.post('/login', authController.login);

// Özel Kafe Sahibi Giriş Rotası
router.post('/cafe-login', authController.loginCafe);

module.exports = router;
