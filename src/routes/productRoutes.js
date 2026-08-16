const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyCafeOwnership } = require('../middlewares/authMiddleware');

// HERKESE AÇIK (PUBLIC) OKUMA ROTALARI (Müşteri Menüsü)
router.get('/category/:categoryId', productController.getProductsByCategoryId);
router.get('/:categoryId', productController.getProductsByCategoryId); // Geriye dönük uyumluluk için

// KORUMALI VERİ DEĞİŞTİRME ROTALARI (Multi-Tenant Firewall)
router.post('/', verifyToken, verifyCafeOwnership, productController.createProduct);
router.put('/:id/toggle', verifyToken, verifyCafeOwnership, productController.toggleProductStatus);
router.put('/status/:id', verifyToken, verifyCafeOwnership, productController.toggleProductStatus); // Ek uyumluluk rotası
router.put('/:id', verifyToken, verifyCafeOwnership, productController.updateProduct);
router.delete('/:id', verifyToken, verifyCafeOwnership, productController.deleteProduct);

module.exports = router;
