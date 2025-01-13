const skipChannel = require('../models/skipChannel'); // Adjust the path as needed

const saveSkipChannelHandler = async (req, res) => {
    try {

        const { channelName, channelId } = req.body;
        const channelexist = await skipChannel.findOne({ channelName });
        if (channelexist) {
            return res.status(400).json({ message: 'Channel already exist' });
        }

        const newSkipChannel = await skipChannel.create({
            channelName,
            channelId
        })

        await newSkipChannel.save();

        res.status(200).json({ message: 'Channel saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error);
    }
}

module.exports = { saveSkipChannelHandler };