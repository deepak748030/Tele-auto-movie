const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm install input

const apiId = 25900274;
const apiHash = "0aa8d2ef404590b2b2cdd434f50d689d";
const stringSession = new StringSession(''); // fill this later with the value from session.save()

(async () => {
    console.log('Loading interactive example...');
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });

    console.log('You should now be connected.');
    console.log(client.session.save()); // Save this string to avoid logging in again

    const channel = await client.getEntity('YOUR_CHANNEL_USERNAME'); // replace with your channel username
    console.log('Channel token:', channel.access_hash);
})();
