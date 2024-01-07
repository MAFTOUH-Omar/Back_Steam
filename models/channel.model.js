const mongoose = require('mongoose');

const channelItemSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
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
});

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;