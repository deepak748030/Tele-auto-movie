const express = require('express');
const { saveAllChannels } = require('../controllers/channel');
const router = express.Router();

router.get('/', saveAllChannels);

module.exports = router;