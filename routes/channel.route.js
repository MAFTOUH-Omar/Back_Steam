const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ChannelController = require('../controllers/channel.controller');
const admin = require('../middlewares/admin.middlewares')

router.use(bodyParser.json());
router.get('/' , admin , ChannelController.getAllChannels)
router.get('/activeChannels' , ChannelController.getAllActiveChannels)
router.post('/addSelectedFieldToAllChannels', ChannelController.addSelectedFieldToAllChannels);
router.put('/updateName/:id', admin ,ChannelController.updateChannelNameById);
router.put('/enable', admin, ChannelController.enableChannelById);
router.put('/disable', admin, ChannelController.disableChannelById);
router.put('/updateOrderChannel', admin, ChannelController.updateChannelsOrder);

module.exports = router;