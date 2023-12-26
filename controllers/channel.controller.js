const Channel = require('../models/channel.model');

const ChannelController = {
    getAllChannels : async (req, res) => {
        try {
            const channels = await Channel.find();
            res.json(channels);
        } catch (error) {
            console.error('Error fetching channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    addSelectedFieldToAllChannels: async (req, res) => {
        try {
            await Channel.updateMany({}, { $set: { 'LiveBouquet.$[].selected': false, 'Vod.$[].selected': false, 'SerieBouquet.$[].selected': false } });
            const updatedChannels = await Channel.find();
            res.json({ message: 'Selected field added to all channels', channels: updatedChannels });
        } catch (error) {
            console.error('Error adding selected field to channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },
}

module.exports = ChannelController;