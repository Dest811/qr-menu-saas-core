const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/:cafeId', categoryController.getCategoriesByCafeId);
router.post('/', verifyToken, categoryController.createCategory);
router.delete('/:id', verifyToken, categoryController.deleteCategory);

module.exports = router;
