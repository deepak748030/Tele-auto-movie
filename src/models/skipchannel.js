const mongoose = require("mongoose");

const skipchannel = new mongoose.Schema({
    channelName: {
        type: String,
        required: true
    },
    channelId: {
        type: Number
    },
}, { timestamps: true });

module.exports = mongoose.model('SkipChannel', skipchannel);