const Messages = require("../models/messages");
const { getTelegramClient } = require("../../telegram/telegramClient");
const Channel = require("../models/channel");
const NodeCache = require("node-cache");
const cache = new NodeCache();

const saveChannelMessages = async () => {
    const startTime = Date.now();

    try {
        const client = getTelegramClient();
        console.log("Telegram client successfully retrieved.");

        let oldestChannel = await Channel.findOne().sort({ updatedAt: 1 });
        if (!oldestChannel) {
            console.log("No channel found in the database.");
            return; // Exit if there are no channels to process
        }

        const channelId = oldestChannel.ChannelId;
        const TM = oldestChannel.totalMessages;
        let offsetId;
        let lastSavedMessage = await Messages.findOne({ channelId }).sort({ messageId: -1 });

        if (lastSavedMessage) {
            offsetId = lastSavedMessage.messageId + 1;
            console.log(`Resuming from message ID: ${offsetId}`);
        } else {
            offsetId = 1;
            console.log("Starting from the beginning (message ID 1).");
        }

        // Fetch and process messages in batches
        const batchSize = 20; // Experiment with different values for batch size
        while (offsetId <= TM) {
            console.log(`Fetching messages for Channel ID: ${channelId}, Starting from Message ID: ${offsetId}`);

            try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Adding delay to avoid rate limiting

                // Fetch a batch of messages
                const messages = await client.getMessages(channelId, { limit: batchSize, offset_id: offsetId });

                if (messages && messages.length > 0) {
                    console.log(`Fetched ${messages.length} messages from Channel ID: ${channelId}.`);

                    for (let message of messages) {
                        console.log(`Processing Message ID: ${message.id} in Channel ID: ${channelId}`);

                        // Add delay for rate limiting purposes
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        if (message.media && message.media.video) {
                            const videoMessage = {
                                messageId: message.id,
                                channelId,
                                messageCaption: message.message || "",
                                fileSize: message.media.video.size
                            };

                            // Check if the message already exists in the database by messageCaption and fileSize
                            const existingMessage = await Messages.findOne({
                                messageCaption: videoMessage.messageCaption,
                                fileSize: videoMessage.fileSize
                            });

                            // Save the message if it doesn't exist
                            if (!existingMessage) {
                                await Messages.create(videoMessage);
                                console.log(`Saved video message with ID: ${videoMessage.messageId}`);
                            } else {
                                console.log(
                                    `Message with caption "${videoMessage.messageCaption}" and file size "${videoMessage.fileSize}" already exists in the database.`
                                );
                            }
                        }
                    }
                } else {
                    console.log("No messages retrieved.");
                }

                offsetId += batchSize; // Increment offsetId by batch size
            } catch (error) {
                // Handle FloodWaitError if it occurs
                if (error.constructor.name === "FloodWaitError") {
                    console.error(`Flood wait error occurred. Waiting for ${error.seconds} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, error.seconds * 1000)); // Wait for the required time
                    continue; // Retry after waiting
                } else {
                    console.error("Error fetching messages:", error);
                    break; // Stop if it's another type of error
                }
            }
        }

        // After processing all messages for the current channel, update the channel's database count
        await Channel.findByIdAndUpdate(oldestChannel._id, { $inc: { databaseCount: 1 } });
        console.log(`Updated database count for Channel ID: ${channelId}.`);

        // Move to the next channel if available
        const nextChannel = await Channel.findOne().sort({ updatedAt: 1 });
        if (nextChannel && nextChannel._id !== oldestChannel._id) {
            console.log("Moving to the next channel...");
            saveChannelMessages(); // Recursive call to process the next channel
        } else {
            console.log("No more channels to process.");
        }

    } catch (error) {
        console.error("Error fetching and saving messages from channels:", error);
    } finally {
        const endTime = Date.now();
        console.log(`Time taken for this cycle: ${(endTime - startTime) / 1000} seconds`);
    }
};

saveChannelMessages();

module.exports = { saveChannelMessages };
