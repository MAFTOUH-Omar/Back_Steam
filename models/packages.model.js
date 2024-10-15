const mongoose = require("mongoose");
const Service = require('./service.model');

var packageSchema = new mongoose.Schema({
    package_id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: [true, "Name not provided"],
    },
    price: {
        type: Number,
        required: [true, "Price not provided"],
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR'],
        default: 'USD',
    },
    duration: {
        type: Number,
        required: [true, "Duration not provided"],
    },
    etat: {
        type: String,
        required: [true, "Etat not provided"],
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("package", packageSchema);