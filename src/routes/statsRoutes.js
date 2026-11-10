const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, verifySuperAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, verifySuperAdmin, statsController.getStats);

module.exports = router;
