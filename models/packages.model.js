const mongoose = require("mongoose");

var packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name not provided"],
    },
    price: {
        type: String,
        required: [true, "Price not provided"],
    },
    duration: {
        type: String,
        required: [true, "Duration not provided"],
    },
    etat: {
        type: String,
        required: [true, "Etat not provided"],
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "service"
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("package", packageSchema);