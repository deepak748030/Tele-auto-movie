// telegramClient.js
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { API_ID, API_HASH, STRING_SESSION } = require("../config");

let client;
console.log(API_ID, API_HASH, STRING_SESSION)
const initTelegramClient = async () => {
    if (client) {
        console.log("Telegram client is already initialized.");
        return client;
    }

    try {
        const apiId = API_ID;
        const apiHash = API_HASH;
        const stringSession = STRING_SESSION;

        if (!apiId || !apiHash || !stringSession) {
            throw new Error("API_ID, API_HASH, and STRING_SESSION must be set in environment variables.");
        }

        client = new TelegramClient(
            new StringSession(stringSession),
            parseInt(apiId, 10),
            apiHash,
            { connectionRetries: 5 }
        );

        console.log("Initializing Telegram client...");
        await client.start();
        console.log("Telegram client connected.");

        client.on("disconnected", async () => {
            console.log("Client disconnected. Reconnecting...");
            await client.connect();
        });

        return client;
    } catch (error) {
        console.error("Failed to initialize Telegram client:", error);
        throw error;
    }
};

const getTelegramClient = () => {
    if (!client) {
        throw new Error("Telegram client is not initialized. Call initTelegramClient first.");
    }
    return client;
};

module.exports = {
    initTelegramClient,
    getTelegramClient,
};
