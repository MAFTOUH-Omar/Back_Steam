const mongoose = require("mongoose");

var serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name not provided"],
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("service", serviceSchema);