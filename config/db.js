const mongoose = require('mongoose')
require('dotenv/config')

exports.connect = ()=>{

    mongoose.set('strictQuery', true);
 
    mongoose.connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
}