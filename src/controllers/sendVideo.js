const { forwardVideosToBot } = require('../utils/sendVideoFiles');

const sendVideo = async (req, res) => {
    try {
        // Forward videos to the bot
        await forwardVideosToBot();

        // Send a success response back
        res.status(200).json({
            message: 'Videos forwarded successfully.',
        });
    } catch (error) {
        console.error(error);

        // Send an error response
        res.status(500).json({
            message: 'An error occurred while forwarding videos.',
            error: error.message,
        });
    }
};

module.exports = { sendVideo };
