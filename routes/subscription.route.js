const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth.middlewares');

router.post('/create-deviceType' , auth , SubscriptionController.createSubscriptionDeviceType);

module.exports = router;
