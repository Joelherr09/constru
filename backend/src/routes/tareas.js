const express = require('express');
const router = express.Router();
const tareasController = require('../controllers/tareasController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware(), tareasController.getTareas);

module.exports = router;