const mongoose = require('mongoose');
const Package = require('./packages.model');

const channelItemSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    bouquet_id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    selected: {
        type: Boolean,
        default: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
});

const channelSchema = new mongoose.Schema({
    LiveBouquet: [channelItemSchema],
    Vod: [channelItemSchema],
    SerieBouquet: [channelItemSchema],
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package"
    },
});

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;