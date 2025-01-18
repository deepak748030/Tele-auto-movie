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
        const channelId = oldestChannel.ChannelId;
        const TM = oldestChannel.totalMessages;
        let offsetId;
        let lastSavedMessage = await Messages.findOne({ channelId }).sort({ messageId: -1 });

        if (lastSavedMessage) {
            offsetId = lastSavedMessage.messageId + 1;
        } else {
            offsetId = 1;
        }

        // Fetch and process messages in batches
        const batchSize = 20; // You can experiment with this value (10, 20, or higher)
        while (offsetId <= TM) {
            console.log("offsetId", offsetId);

            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Fetch a batch of messages
                const messages = await client.getMessages(channelId, { limit: batchSize, offset_id: offsetId });
                if (messages && messages.length > 0) {
                    for (let message of messages) {
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
                                messageCaption: videoMessage.messageCaption
                            });

                            // Save the message immediately if it doesn't exist
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
                    await new Promise(resolve => setTimeout(resolve, error.seconds * 6000)); // Wait for the required time
                    continue; // Retry the operation after waiting
                } else {
                    console.error("Error fetching messages:", error);
                    break; // If it's another error, stop the loop
                }
            }
        }

        // Increment the database count and continue
        await Channel.findByIdAndUpdate(oldestChannel._id, { $inc: { databaseCount: 1 } });
        saveChannelMessages(); // Recursive call to continue the process
    } catch (error) {
        console.error("Error fetching and saving messages from channels:", error);
    } finally {
        const endTime = Date.now();
        console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);
    }
};

saveChannelMessages();

module.exports = { saveChannelMessages };
