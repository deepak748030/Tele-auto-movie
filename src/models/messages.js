const { default: mongoose } = require("mongoose");

const message = new mongoose.Schema({
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: Number,
        required: true
    },
    messageCaption: {
        type: String
    },
    messageForwarded: {
        type: Boolean,
        default: false
    },
    fileSize: {
        type: Number
    }

}, { timestamps: true });

module.exports = mongoose.model('Message', message);