const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authMiddleware(['administrador']), authController.register); // Solo admins pueden registrar
router.get('/test', (req, res) => res.json({ message: 'Backend funcionando' }));

module.exports = router;