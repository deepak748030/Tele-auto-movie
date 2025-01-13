const express = require('express');
const { getChannelsData } = require('../controllers/channel');
const router = express.Router();

router.get('/', getChannelsData);

module.exports = router;