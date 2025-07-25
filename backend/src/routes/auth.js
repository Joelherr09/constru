const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/test', (req, res) => res.json({ message: 'Backend funcionando' }));

module.exports = router;