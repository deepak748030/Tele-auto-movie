const channel = require('../models/channel');
const { getAllChannel } = require('../utils/helper');

const saveAllChannels = async (req, res) => {
    try {
        getAllChannel()
        res.json({ message: 'Channels saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



module.exports = { saveAllChannels };