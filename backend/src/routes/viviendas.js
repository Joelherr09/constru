const express = require('express');
const router = express.Router();
const viviendaController = require('../controllers/viviendaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id', authMiddleware(), viviendaController.getVivienda);
router.put('/material', authMiddleware(['administrador']), viviendaController.updateMaterial);
router.put('/progreso', authMiddleware(['administrador']), viviendaController.updateProgreso);
router.post('/:id/partidas', authMiddleware(['administrador']), viviendaController.addPartidaToVivienda);

module.exports = router;