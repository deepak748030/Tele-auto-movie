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

        let channels = cache.get("channels");
        if (!channels) {
            channels = await Channel.find();
            cache.set("channels", channels);
        }

        let currentChannelIndex = cache.get("currentChannelIndex") || 0;
        if (currentChannelIndex >= channels.length) {
            currentChannelIndex = 0;
        }

        const channel = channels[currentChannelIndex];
        const channelId = channel.ChannelId;

        const lastProcessedMessage = await Messages.findOne({ channelId }).sort({ createdAt: -1 });
        const lastProcessedMessageId = lastProcessedMessage ? lastProcessedMessage.messageId : 0;
        let offsetId = lastProcessedMessageId;
        let allMessages = [];
        let totalFetchedMessages = 0;

        console.log(`Processing channel: ${channelId}, lastMessageId: ${lastProcessedMessageId}`);

        while (totalFetchedMessages < 20) {
            console.log(`Fetching messages for channel: ${channelId}, offsetId: ${offsetId}`);
            const messages = await client.getMessages(channelId, { limit: 20, offset_id: offsetId });

            if (!messages || messages.length === 0) {
                console.log("No more messages to fetch.");
                break;
            }

            allMessages = allMessages.concat(messages);
            offsetId = messages[messages.length - 1].id;
            totalFetchedMessages += messages.length;

            console.log(`Fetched ${messages.length} messages. Total: ${allMessages.length}`);

            if (totalFetchedMessages >= 20) {
                console.log("Reached the limit of 20 messages.");
                break;
            }

            // Take a break of 300 milliseconds after fetching each batch of messages
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log(`Total messages fetched for channel ${channelId}: ${allMessages.length}`);

        // Filter messages to include only video, document, or service messages
        const videoOrDocumentMessages = allMessages
            .filter((message) => message.media && (message.media.video || message.media.document || message.media.type === 'messageService'))
            .map((message) => ({
                messageId: message.id,
                channelId,
                messageCaption: message.message || "",
                fileSize: message.media.document ? message.media.document.size : (message.media.video ? message.media.video.size : 0)
            }));

        console.log("Filtered video, document, or service messages:", videoOrDocumentMessages);

        // Remove duplicates from the fetched data based on channelId and messageId
        const uniqueMessages = videoOrDocumentMessages.filter((msg, index, self) =>
            index === self.findIndex((m) => m.messageId === msg.messageId && m.channelId === msg.channelId)
        );

        console.log("Unique messages after removing duplicates from fetched data:", uniqueMessages);

        // Fetch existing messages from the database
        const existingMessages = await Messages.find({ 
            channelId, 
            messageId: { $in: uniqueMessages.map(msg => msg.messageId) } 
        }, { messageId: 1, channelId: 1 });

        // Create a set of keys for existing messages to identify duplicates
        const existingMessageIds = new Set(existingMessages.map((msg) => `${msg.channelId}-${msg.messageId}`));

        // Filter out messages that are already in the database
        const newMessages = uniqueMessages.filter((msg) => {
            const uniqueKey = `${msg.channelId}-${msg.messageId}`;
            if (existingMessageIds.has(uniqueKey)) {
                console.log(`Message with ID ${msg.messageId} in channel ${msg.channelId} is a duplicate and will not be saved.`);
                return false;
            }
            return true;
        });

        console.log("New video, document, or service messages to be saved:", newMessages);

        // Save new messages to the database
        if (newMessages.length > 0) {
            const savedMessages = await Messages.insertMany(newMessages);
            console.log(`Saved ${savedMessages.length} new messages to the database.`);
        } else {
            console.log("No new messages to save.");
        }

        if (allMessages.length > 0) {
            const lastMessageId = allMessages[allMessages.length - 1].id;
            cache.set(`${channelId}_lastMessageId`, lastMessageId); // Cache the last processed message ID
        }

        // Update the current channel index for the next run
        currentChannelIndex = (currentChannelIndex + 1) % channels.length;
        cache.set("currentChannelIndex", currentChannelIndex);
    } catch (error) {
        console.error("Error fetching and saving messages from channels:", error);
    } finally {
        const endTime = Date.now();
        console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);
    }
};

// Run the function at regular intervals
setInterval(saveChannelMessages, 10000);

module.exports = { saveChannelMessages };
