const Messages = require("../models/messages");
const { getTelegramClient } = require("../../telegram/telegramClient");
const Channel = require("../models/channel");
const moment = require('moment-timezone');

const saveTodaysVideos = async () => {
    const startTime = Date.now();
    console.log("Starting daily video fetch...");

    try {
        const client = getTelegramClient();
        const today = moment().tz('Asia/Kolkata').startOf('day');
        const tomorrow = today.clone().add(1, 'day');

        const channels = await Channel.find({}).lean();
        if (!channels?.length) {
            console.log("No channels found");
            return;
        }

        for (const channel of channels) {
            console.log(`Processing ${channel.channelName}...`);
            let offsetId = 0;
            let hasMore = true;
            let dailyCount = 0;

            try {
                // Get proper channel entity
                const entity = await client.getInputEntity(channel.ChannelId);

                while (hasMore) {
                    await delay(500);

                    const messages = await client.getMessages(entity, {
                        offsetId,
                        limit: 100
                    });

                    if (!messages.length) {
                        hasMore = false;
                        break;
                    }

                    const messageIds = messages
                        .filter(msg => msg.media?.video)
                        .map(msg => msg.id);

                    // Check existing messages in bulk
                    const existingMessages = await Messages.find({
                        channelId: channel._id,
                        messageId: { $in: messageIds }
                    }).select("messageId");

                    const existingMessageIds = new Set(existingMessages.map(msg => msg.messageId));

                    for (const msg of messages) {
                        // Handle date properly
                        const msgDate = moment.unix(msg.date).tz('Asia/Kolkata');

                        if (msgDate.isSameOrAfter(tomorrow)) continue;
                        if (msgDate.isBefore(today)) {
                            hasMore = false;
                            break;
                        }

                        if (msg.media?.video && !existingMessageIds.has(msg.id)) {
                            await Messages.create({
                                messageId: msg.id,
                                channelId: channel._id,
                                messageCaption: msg.message,
                                fileSize: msg.media.video.size,
                                messageDate: msgDate.toDate()
                            });
                            dailyCount++;
                        }
                        offsetId = msg.id;
                    }
                }

                await Channel.findByIdAndUpdate(channel._id, {
                    $inc: { databaseCount: dailyCount },
                    $set: { lastChecked: new Date() }
                });
                console.log(`Added ${dailyCount} new videos from ${channel.channelName}`);

            } catch (error) {
                await handleChannelError(error, channel.channelName, entity);
            }
        }

        console.log(`Completed in ${(Date.now() - startTime) / 1000}s`);
    } catch (error) {
        console.error("Fatal error:", error);
    }
};

// Helper functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const handleChannelError = async (error, channelName, entity) => {
    if (error.constructor.name === "FloodWaitError") {
        const waitTime = error.seconds;
        console.warn(`Flood wait for ${waitTime}s in ${channelName}`);
        await delay(waitTime * 1000);
        return;
    }

    if (error.message.includes("CHANNEL_INVALID")) {
        console.error(`Invalid channel ${channelName}, consider removing from database`);
        return;
    }

    console.error(`Error in ${channelName}:`, error.message);

    // Try to re-fetch entity if connection lost
    if (error.message.includes("Could not find the input entity")) {
        try {
            await entity?.refresh();
        } catch (refreshError) {
            console.error(`Failed to refresh entity for ${channelName}:`, refreshError.message);
        }
    }
};

// saveTodaysVideos();
module.exports = { saveTodaysVideos };
