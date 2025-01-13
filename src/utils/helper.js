// getAllChannel.js
const { createClient } = require("../../telegram/telegramClient");
const Channel = require("../models/channel");
const SkipChannel = require("../models/skipChannel"); // Import the SkipChannel model

const getAllChannel = async () => {
    try {
        // Create and connect the client
        const client = await createClient();  // Ensure that it's awaited if needed

        // Fetch the dialogs (channels, groups, etc.)
        const dialogs = await client.getDialogs();
        const channels = dialogs.filter(dialog => dialog.isChannel || dialog.isGroup);

        // Loop through each channel and save/update the data
        for (const channel of channels) {
            // Check if the channel name exists in the SkipChannel collection
            const skipChannel = await SkipChannel.findOne({ channelName: channel.title });
            if (skipChannel) {
                console.log(`Skipping channel: ${channel.title}`);
                continue; // Skip this channel
            }

            const channelData = {
                channelName: channel.title,
                ChannelId: channel.id,
                totalMessages: channel.dialog.topMessage,
                accessHash: channel.accessHash,
                usersJoined: channel.participantsCount,  // Assuming `participantsCount` provides users count
                databaseCount: channel.dialog.unreadCount // Assuming `unreadCount` can act as offset or database count
            };

            try {
                // Update or insert the channel data in the database
                await Channel.findOneAndUpdate(
                    { ChannelId: channel.id },
                    channelData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log(`Channel data saved/updated for: ${channel.title}`);
            } catch (err) {
                console.error(`Error updating/inserting channel: ${err}`);
            }
        }
    } catch (error) {
        console.error(`Error in getAllChannel: ${error}`);
    }
};

module.exports = { getAllChannel };
