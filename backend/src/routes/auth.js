const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

module.exports = router;