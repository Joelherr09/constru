const express = require('express');
const router = express.Router();
const partidasController = require('../controllers/partidasController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware(), partidasController.getPartidas);

module.exports = router;