require('./db/db')();
const express = require('express');
const { PORT } = require('./config');
const app = express();
const port = PORT;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});