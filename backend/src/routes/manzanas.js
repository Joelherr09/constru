const express = require('express');
const router = express.Router();
const manzanaController = require('../controllers/manzanaController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware());

router.get('/', manzanaController.getManzanas);
router.get('/:id', authMiddleware(), manzanaController.getManzanaById);
router.get('/:id/viviendas', manzanaController.getViviendasByManzana);
router.post('/', authMiddleware(['administrador']), manzanaController.createManzana);

module.exports = router;