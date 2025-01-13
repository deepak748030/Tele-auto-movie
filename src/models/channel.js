const { default: mongoose } = require("mongoose");

const channel = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    users: {
        type: Number,
        required: true
    },
    totalMessages: {
        type: Number,
        required: true
    },
    uploadedMessages: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Channel', channel);