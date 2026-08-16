const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyCafeOwnership } = require('../middlewares/authMiddleware');

// HERKESE AÇIK (PUBLIC) OKUMA ROTALARI (Müşteri Menüsü)
router.get('/cafe/:cafeId', categoryController.getCategoriesByCafeId);
router.get('/:cafeId', categoryController.getCategoriesByCafeId); // Geriye dönük uyumluluk için

// KORUMALI VERİ DEĞİŞTİRME ROTALARI (Multi-Tenant Firewall)
router.post('/', verifyToken, verifyCafeOwnership, categoryController.createCategory);
router.put('/:id', verifyToken, verifyCafeOwnership, categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyCafeOwnership, categoryController.deleteCategory);

module.exports = router;
