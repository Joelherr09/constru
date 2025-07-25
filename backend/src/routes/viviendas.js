const express = require('express');
const router = express.Router();
const viviendaController = require('../controllers/viviendaController');

router.get('/:id', viviendaController.getVivienda);

module.exports = router;