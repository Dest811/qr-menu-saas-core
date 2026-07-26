const express = require('express');
const router = express.Router();
const cafeController = require('../controllers/cafeController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', cafeController.getAllCafes);
router.get('/slug/:slug', cafeController.getCafeBySlug);
router.get('/domain/:domainName', cafeController.getCafeByDomain);
router.get('/:id', cafeController.getCafeById);

router.post('/', verifyToken, cafeController.createCafe);
router.put('/:id', verifyToken, cafeController.updateCafe);
router.delete('/:id', verifyToken, cafeController.deleteCafe);

module.exports = router;
