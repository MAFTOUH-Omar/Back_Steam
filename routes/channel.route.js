const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const ChannelController = require('../controllers/channel.controller');

router.use(bodyParser.json());
router.get('/' , ChannelController.getAllChannels)

module.exports = router;