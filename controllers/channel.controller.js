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
            await Channel.updateMany({}, { $set: { 'LiveBouquet.$[].active': true, 'Vod.$[].active': true, 'SerieBouquet.$[].active': true } });
            const updatedChannels = await Channel.find();
            res.json({ message: 'Selected field added to all channels', channels: updatedChannels });
        } catch (error) {
            console.error('Error adding selected field to channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    updateChannelNameById: async (req, res) => {
        const channelId = req.params.id;
        const { newName } = req.body;

        try {
            const channel = await Channel.findOne();
            if (!channel) {
                return res.status(404).json({ message: 'Channel not found' });
            }

            await channel.updateChannelNameById(channelId, newName);
            res.json({ message: 'Channel name updated successfully' });
        } catch (error) {
            console.error('Error updating channel name:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    enableChannelById: async (req, res) => {
        const { ids } = req.body;
    
        try {
            const updateOperations = ids.map((id) => ({
                updateOne: {
                filter: { 'LiveBouquet._id': id },
                update: { $set: { 'LiveBouquet.$.active': true } },
                },
            }));
              
            await Channel.bulkWrite(updateOperations);
        
            const updatedChannels = await Channel.find();
            res.json({ message: 'Channels activated successfully', channels: updatedChannels });
        } catch (error) {
            console.error('Error activating channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    disableChannelById: async (req, res) => {
        const { ids } = req.body;
    
        try {
            const updateOperations = ids.map((id) => ({
                updateOne: {
                filter: { 'LiveBouquet._id': id },
                update: { $set: { 'LiveBouquet.$.active': false } },
                },
            }));
        
            await Channel.bulkWrite(updateOperations);
            
            const updatedChannels = await Channel.find();
            res.json({ message: 'Channels deactivated successfully', channels: updatedChannels });
        } catch (error) {
            console.error('Error deactivating channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    updateChannelsOrder: async (req, res) => {
        const { liveOrder, vodOrder, serieOrder } = req.body;
    
        try {
            await Channel.updateMany({}, { $set: { 'LiveBouquet': liveOrder } });
        
            await Channel.updateMany({}, { $set: { 'Vod': vodOrder } });
        
            await Channel.updateMany({}, { $set: { 'SerieBouquet': serieOrder } });
        
            const updatedChannels = await Channel.find();
            res.json({ message: 'Channels order updated successfully', channels: updatedChannels });
        } catch (error) {
            console.error('Error updating channels order:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    getAllActiveChannels: async (req, res) => {
        try {
            const { packageId } = req.params;
    
            if (!packageId) {
                return res.status(400).json({ error: "packageId is required" });
            }
    
            const channels = await Channel.find({ packageId });
    
            if (!channels.length) {
                return res.status(404).json({ error: "No channels found for the given packageId" });
            }
    
            const activeChannels = channels.reduce((result, channel) => {
                const liveBouquet = channel.LiveBouquet.filter(item => item.active);
                const vod = channel.Vod.filter(item => item.active);
                const serieBouquet = channel.SerieBouquet.filter(item => item.active);
    
                result.push({
                    _id: channel._id,
                    LiveBouquet: liveBouquet,
                    Vod: vod,
                    SerieBouquet: serieBouquet,
                });
    
                return result;
            }, []);
    
            res.json(activeChannels);
        } catch (error) {
            console.error('Error fetching active channels:', error);
            res.status(500).send('Internal Server Error');
        }
    },    
}

module.exports = ChannelController;