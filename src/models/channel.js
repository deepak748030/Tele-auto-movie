const { default: mongoose } = require("mongoose");

const channel = new mongoose.Schema({
    ChannelId: {
        type: Number,
        required: true
    },
    channelName: {
        type: String,
        required: true
    },
    usersJoined: {
        type: Number,
        required: true
    },
    totalMessages: {
        type: Number,
        required: true
    },
    uploadedMessages: {
        type: Number,
        default: 0
    },
    accessHash: {
        type: Number,
        required: true
    },
    databaseCount: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model('Channel', channel);