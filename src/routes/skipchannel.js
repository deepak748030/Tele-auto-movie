const express = require('express');
const { saveSkipChannelHandler } = require('../controllers/skipchannel');
const router = express.Router();

router.post('/create', saveSkipChannelHandler);


module.exports = router;