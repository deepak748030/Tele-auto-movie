const { default: mongoose } = require("mongoose");

const messageSchema = new mongoose.Schema({
    channelId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Channel collection
        ref: "Channel", // Refers to the "Channel" model
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

module.exports = mongoose.model("Message", messageSchema);
