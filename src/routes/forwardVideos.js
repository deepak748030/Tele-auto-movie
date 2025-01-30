const express = require('express');
const { sendVideo } = require('../controllers/sendVideo');
const router = express.Router();

router.get('/', sendVideo);

module.exports = router;