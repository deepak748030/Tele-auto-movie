const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const connectdb = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Database connected');
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectdb;