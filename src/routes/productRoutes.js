const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/:categoryId', productController.getProductsByCategoryId);
router.post('/', verifyToken, productController.createProduct);
router.put('/:id/toggle', verifyToken, productController.toggleProductStatus);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
