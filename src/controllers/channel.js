const channel = require('../models/channel');

const getChannelsData = async (req, res) => {
    try {
        const channels = await channel.getChannels();
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



module.exports = { getChannelsData };