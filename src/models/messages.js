const { default: mongoose } = require("mongoose");

const message = new mongoose.Schema({
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    messageCaption: {
        type: String
    },
    messageForwarded: {
        type: Boolean,
        default: false
    },

}, { timestamps: true });

module.exports = mongoose.model('Message', message);