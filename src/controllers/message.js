
const { saveTodaysVideos } = require('../utils/saveChannelmessages');

const saveChannelMessage = async (req, res) => {
    try {
        saveTodaysVideos();
        res.status(201).json('start saving messages');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { saveChannelMessage };