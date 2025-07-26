const express = require('express');
const router = express.Router();
const viviendaController = require('../controllers/viviendaController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id', authMiddleware(), viviendaController.getVivienda);
router.put('/:id', authMiddleware(['administrador']), viviendaController.updateVivienda);
router.post('/:id/partidas', authMiddleware(['administrador']), viviendaController.addPartidaToVivienda);
router.post('/:id/tareas', authMiddleware(['administrador']), viviendaController.addTareaToVivienda);
router.put('/material', authMiddleware(['administrador']), viviendaController.updateMaterial);
router.put('/progreso', authMiddleware(['administrador']), viviendaController.updateProgreso);

module.exports = router;