const { initTelegramClient } = require('./telegram/telegramClient');
initTelegramClient();
require('./db/db')();
const express = require('express');
const { PORT } = require('./config');
const morgan = require('morgan');
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/saveallchannels', require('./src/routes/channel'));
app.use('/skipchannel', require('./src/routes/skipchannel'));
app.use('/messages', require('./src/routes/message'));



app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});