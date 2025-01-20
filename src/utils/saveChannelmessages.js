const Messages = require("../models/messages");
const { getTelegramClient } = require("../../telegram/telegramClient");
const Channel = require("../models/channel");

/**
 * Fetches and saves video messages from Telegram channels into the database.
 * Processes channels one by one, fetching messages in batches.
 */
const saveChannelMessages = async () => {
    const startTime = Date.now();
    console.log("Starting to fetch and save video messages...");

    try {
        const client = getTelegramClient();
        console.log("Telegram client successfully initialized.");

        // Fetch all channels from the database
        const channels = await Channel.find({}).lean().sort({ totalMessages: 1 });
        if (!channels || channels.length === 0) {
            console.log("No channels found in the database.");
            return;
        }

        // Process each channel completely before moving to the next
        for (const channel of channels) {
            const { _id: channelId, channelName, databaseCount } = channel;

            console.log(`Processing channel: ${channelName} (ID: ${channelId})`);
            let offsetId = 0; // Start from the first message
            let hasMoreMessages = true;

            try {
                // Resolve channel entity
                // const resolvedChannel = await client.getEntity(channelId.toString());

                // Fetch and process messages until there are no more messages
                while (hasMoreMessages) {
                    console.log(`Fetching messages for Channel: ${channelName}, Offset ID: ${offsetId}`);

                    // Add a delay to avoid rate-limiting
                    await delay(100);

                    // Fetch all messages
                    const messages = await client.getMessages(channel.ChannelId, {
                        offset_id: offsetId,
                    });

                    // Stop processing if no messages are retrieved
                    if (!messages || messages.length === 0) {
                        console.log(`No more messages to fetch for Channel: ${channelName}.`);
                        hasMoreMessages = false;
                        break;
                    }

                    // Process each message in the batch
                    for (const message of messages) {
                        console.log(`Processing Message ID: ${message.id} in Channel: ${channelName}`);

                        // Add a delay for rate-limiting purposes
                        await delay(400);

                        if (message.media && message.media.video) {
                            const videoMessage = {
                                messageId: message.id,
                                channelId,
                                messageCaption: message.message || "",
                                fileSize: message.media.video.size,
                            };

                            // Check if the message already exists
                            const exists = await Messages.findOne({
                                messageId: message.id,
                                channelId,
                            });
                            if (!exists) {
                                // Save the new message
                                await Messages.create(videoMessage);
                                console.log(`Saved video message with ID: ${message.id}`);
                            } else {
                                console.log(`Message ID: ${message.id} already exists.`);
                            }
                        }
                    }

                    // Update the offsetId to the last message ID from this batch
                    offsetId = messages[messages.length - 1].id - 1;

                    // If fewer messages are retrieved than the batch size, stop further processing
                    if (messages.length < 100) { // Assuming batch size is 100
                        hasMoreMessages = false;
                        console.log(`No more messages left in Channel: ${channelName}.`);
                    }
                }

                // Update the database count for the channel
                await Channel.findByIdAndUpdate(channelId, { $set: { totalMessages: offsetId + 1, databaseCount: databaseCount + 1 } });
                console.log(`Updated database count and totalMessages for Channel: ${channelName}`);
            } catch (error) {
                // Handle specific errors
                if (error.constructor.name === "FloodWaitError") {
                    console.error(
                        `Flood wait error: Waiting for ${error.seconds} seconds before retrying...`
                    );
                    await delay(error.seconds * 1000);
                } else if (error.message.includes("Cannot cast")) {
                    console.error(`Cannot process Channel: ${channelName} due to casting error. Skipping...`);
                } else {
                    console.error(`Error processing Channel: ${channelName}`, error);
                    break; // Stop processing the current channel on unknown errors
                }
            }
        }

        console.log("All channels have been processed successfully.");
    } catch (error) {
        console.error("Error fetching and saving messages:", error);
    } finally {
        const endTime = Date.now();
        console.log(`Time taken for this cycle: ${(endTime - startTime) / 1000} seconds`);
    }
};

/**
 * Utility function to add a delay
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Run the function
saveChannelMessages();

module.exports = { saveChannelMessages };
