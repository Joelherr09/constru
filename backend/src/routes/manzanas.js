const express = require('express');
const router = express.Router();
const manzanaController = require('../controllers/manzanaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware(), manzanaController.getManzanas);
router.get('/:id/viviendas', authMiddleware, manzanaController.getViviendasByManzana);

module.exports = router;