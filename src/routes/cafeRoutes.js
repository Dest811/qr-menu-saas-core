const express = require('express');
const router = express.Router();
const cafeController = require('../controllers/cafeController');
const { verifyToken, verifyCafeOwnership, verifySuperAdmin } = require('../middlewares/authMiddleware');

// HERKESE AÇIK (PUBLIC) OKUMA ROTALARI (Müşteri Menüsü & Genel Bilgiler)
router.get('/full-menu/:identifier', cafeController.getFullMenu); // Optimize tek seferlik menü çekme
router.get('/slug/:slug', cafeController.getCafeBySlug);
router.get('/domain/:domainName', cafeController.getCafeByDomain);
router.get('/:id', cafeController.getCafeById);

// KAFE SAHİBİ GİRİŞ ROTASI
router.post('/login', cafeController.loginCafe);

// KORUMALI VERİ DEĞİŞTİRME & YÖNETİM ROTALARI (Multi-Tenant Firewall)
// TÜM KAFELERİ LİSTELEME, YENİ KAFE OLUŞTURMA VE SİLME: Sadece Süper Admin yapabilir
router.get('/', verifyToken, verifySuperAdmin, cafeController.getAllCafes);
router.post('/', verifyToken, verifySuperAdmin, cafeController.createCafe);
router.put('/:id', verifyToken, verifyCafeOwnership, cafeController.updateCafe);
router.delete('/:id', verifyToken, verifySuperAdmin, cafeController.deleteCafe);

module.exports = router;
