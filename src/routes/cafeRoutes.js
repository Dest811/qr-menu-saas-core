const express = require('express');
const router = express.Router();
const cafeController = require('../controllers/cafeController');
const { verifyToken, verifyCafeOwnership, verifySuperAdmin } = require('../middlewares/authMiddleware');

// HERKESE AÇIK (PUBLIC) OKUMA ROTALARI (Müşteri Menüsü & Genel Bilgiler)
router.get('/', cafeController.getAllCafes);
router.get('/full-menu/:identifier', cafeController.getFullMenu); // YENİ: Optimize tek seferlik menü çekme
router.get('/slug/:slug', cafeController.getCafeBySlug);
router.get('/domain/:domainName', cafeController.getCafeByDomain);
router.get('/:id', cafeController.getCafeById);

// KAFE SAHİBİ GİRİŞ ROTASI
router.post('/login', cafeController.loginCafe);

// KORUMALI VERİ DEĞİŞTİRME ROTALARI (Multi-Tenant Firewall)
// YENİ KAFE OLUŞTURMA: Sadece Süper Admin yapabilir
router.post('/', verifyToken, verifySuperAdmin, cafeController.createCafe);
router.put('/:id', verifyToken, verifyCafeOwnership, cafeController.updateCafe);
router.delete('/:id', verifyToken, verifyCafeOwnership, cafeController.deleteCafe);

module.exports = router;
