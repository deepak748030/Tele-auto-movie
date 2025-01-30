const Messages = require("../models/messages");
const { getTelegramClient } = require("../../telegram/telegramClient");

const forwardVideosToBot = async () => {
    console.log("Starting to forward videos...");

    try {
        const client = getTelegramClient();
        const botUsername = "movie_cast_bot";

        let hasMore = true;

        while (hasMore) {
            // Fetch 30 unforwarded messages
            const messages = await Messages.find({ messageForwarded: false })
                .limit(30)
                .lean()
                .populate('channelId');
            // console.log(messages)
            if (!messages.length) {
                console.log("No more videos to forward.");
                hasMore = false;
                break;
            }

            for (const msg of messages) {
                try {
                    console.log(msg.messageId, msg.channelId.ChannelId)
                    await client.forwardMessages(botUsername, {
                        messages: msg.messageId,
                        fromPeer: msg.channelId.ChannelId
                    });

                    // Mark as forwarded
                    await Messages.updateOne(
                        { _id: msg._id },
                        { $set: { messageForwarded: true } }
                    );

                    console.log(`Forwarded message ID: ${msg.messageId}`);
                } catch (error) {
                    console.error(`Failed to forward message ${msg.messageId}:`, error.message);
                }

                // Add delay to avoid spam blocking
                await delay(2000);
            }
        }

        console.log("All available videos forwarded.");
    } catch (error) {
        console.error("Fatal error while forwarding videos:", error);
    }
};

// Helper function to avoid rate limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { forwardVideosToBot };
