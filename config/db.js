const mongoose = require('mongoose');
require('dotenv/config');

exports.connect = () => {
    mongoose.set('strictQuery', true);

    mongoose.connect(process.env.DB)
    .then(() => {
        console.log("Successfully connected to the database");
    })
    .catch((error) => {
        console.log("Database connection failed. Exiting now...");
        console.error(error);
        process.exit(1);
    });
}