const { forwardVideosToBot } = require('../utils/sendVideoFiles')

const sendVideo = async (req, res) => {
    try {
        forwardVideosToBot()
    } catch (error) {
        console.log(error)
    }
}

module.exports = { sendVideo };