const message = require('../models/messages');
const { saveChannelMessages } = require('../utils/saveChannelmessages');

const saveChannelMessage = async (req, res) => {
    try {
        saveChannelMessages();
        res.status(201).json('start saving messages');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { saveChannelMessage };