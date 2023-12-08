const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth.middlewares');
const admin = require('../middlewares/admin.middlewares');

router.post('/create-deviceType' , auth , SubscriptionController.createSubscriptionDeviceType);
router.post('/create-liveBouquet' , auth , SubscriptionController.createSubscriptionLiveBouquet);
router.get('/count-subscription' , admin , SubscriptionController.countSubscriptions);
router.get('/subscription-user' , auth , SubscriptionController.getAllSubscriptionsByUserId);
router.get('/subscription-subscription' , auth , SubscriptionController.getSubscriptionById);

module.exports = router;