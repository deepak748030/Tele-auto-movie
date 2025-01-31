const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI,
    API_ID: process.env.API_ID,
    API_HASH: process.env.API_HASH,
    STRING_SESSION: process.env.STRING_SESSION,
    // JWT_SECRET: process.env.JWT_SECRET,
}