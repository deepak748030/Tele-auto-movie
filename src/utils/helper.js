const { createClient } = require("../../telegram/telegramClient");
const Channel = require("../models/channel");
const SkipChannel = require("../models/skipChannel");

const getAllChannel = async () => {
    console.time('getAllChannel'); // Start the timer
    try {
        // Create and connect the client
        const client = await createClient();

        // Fetch the dialogs and skip channels concurrently
        const [dialogs, skipChannels] = await Promise.all([
            client.getDialogs(),
            SkipChannel.find({}).lean() // Use lean() for faster read
        ]);

        const skipChannelSet = new Set(skipChannels.map(sc => sc.channelName));

        const bulkOps = dialogs
            .filter(dialog => (dialog.isChannel || dialog.isGroup) && !skipChannelSet.has(dialog.title))
            .map(dialog => ({
                updateOne: {
                    filter: { ChannelId: dialog.id },
                    update: {
                        $set: {
                            channelName: dialog.title,
                            totalMessages: dialog.dialog.topMessage,
                            accessHash: dialog.accessHash,
                            usersJoined: dialog.participantsCount,
                            databaseCount: dialog.dialog.unreadCount
                        }
                    },
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            }));

        // Execute bulk operations
        if (bulkOps.length > 0) {
            await Channel.bulkWrite(bulkOps);
            console.log(`Bulk operation completed for ${bulkOps.length} channels.`);
        }
    } catch (error) {
        console.error(`Error in getAllChannel: ${error}`);
    }
    console.timeEnd('getAllChannel'); // End the timer
};

module.exports = { getAllChannel };
