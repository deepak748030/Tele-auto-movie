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

        while (totalFetchedMessages < 100) {
            console.log(`Fetching messages for channel: ${channelId}, offsetId: ${offsetId}`);
            const messages = await client.getMessages(channelId, { limit: 300, offset_id: offsetId });

            if (!messages || messages.length === 0) {
                console.log("No more messages to fetch.");
                break;
            }

            allMessages = allMessages.concat(messages);
            offsetId = messages[messages.length - 1].id;
            totalFetchedMessages += messages.length;

            console.log(`Fetched ${messages.length} messages. Total: ${allMessages.length}`);

            if (totalFetchedMessages >= 100) {
                console.log("Reached the limit of 100 messages.");
                break;
            }
        }

        console.log(`Total messages fetched for channel ${channelId}: ${allMessages.length}`);

        const videoOrDocumentMessages = allMessages
            .filter((message) => message.media && (message.media.video || message.media.document))
            .map((message) => ({
                messageId: message.id,
                channelId,
                messageCaption: message.message || "",
            }));

        console.log("Filtered video or document messages:", videoOrDocumentMessages);

        const existingMessages = await Messages.find({ channelId }, { messageId: 1 });
        const existingMessageIds = new Set(existingMessages.map((msg) => msg.messageId));

        const newMessages = videoOrDocumentMessages.filter(
            (msg) => !existingMessageIds.has(msg.messageId)
        );

        console.log("New video or document messages to be saved:", newMessages);

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

        currentChannelIndex = (currentChannelIndex + 1) % channels.length;
        cache.set("currentChannelIndex", currentChannelIndex);
        console.log(lastProcessedMessage)
    } catch (error) {
        console.error("Error fetching and saving messages from channels:", error);
    } finally {
        const endTime = Date.now();
        console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);
    }
};

module.exports = { saveChannelMessages };
