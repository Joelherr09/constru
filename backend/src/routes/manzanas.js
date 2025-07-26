const express = require('express');
const router = express.Router();
const manzanaController = require('../controllers/manzanaController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware());

router.get('/', manzanaController.getManzanas);
router.get('/:id/viviendas', manzanaController.getViviendasByManzana);

module.exports = router;