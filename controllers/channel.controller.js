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
    }
}

module.exports = ChannelController;