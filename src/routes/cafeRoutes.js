const express = require('express');
const router = express.Router();
const cafeController = require('../controllers/cafeController');
const { verifyToken, verifyCafeOwnership } = require('../middlewares/authMiddleware');

// HERKESE AÇIK (PUBLIC) OKUMA ROTALARI (Müşteri Menüsü & Genel Bilgiler)
router.get('/', cafeController.getAllCafes);
router.get('/slug/:slug', cafeController.getCafeBySlug);
router.get('/domain/:domainName', cafeController.getCafeByDomain);
router.get('/:id', cafeController.getCafeById);

// KAFE SAHİBİ GİRİŞ ROTASI
router.post('/login', cafeController.loginCafe);

// KORUMALI VERİ DEĞİŞTİRME ROTALARI (Multi-Tenant Firewall)
router.post('/', verifyToken, verifyCafeOwnership, cafeController.createCafe);
router.put('/:id', verifyToken, verifyCafeOwnership, cafeController.updateCafe);
router.delete('/:id', verifyToken, verifyCafeOwnership, cafeController.deleteCafe);

module.exports = router;
