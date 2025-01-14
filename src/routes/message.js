const express = require('express');
const { saveChannelMessage } = require('../controllers/message');
const router = express.Router();

router.get('/savemessages', saveChannelMessage);

module.exports = router;