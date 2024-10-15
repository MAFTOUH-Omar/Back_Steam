const mongoose = require('mongoose');
const Service = require('./service.model');

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
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service"
    },
});

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;