const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth.middlewares');
const admin = require('../middlewares/admin.middlewares');

router.post('/create-deviceType' , auth , SubscriptionController.createSubscriptionDeviceType);
router.post('/create-liveBouquet' , auth , SubscriptionController.createSubscriptionLiveBouquet);
router.get('/count-subscription' , admin , SubscriptionController.countSubscriptions);
router.get('/getAllSubscriptionsWithUserAndPackage' , admin , SubscriptionController.getAllSubscriptionsWithUserAndPackage);
router.get('/subscription-user' , auth , SubscriptionController.getAllSubscriptionsByUserId);
router.get('/:subscriptionId' , auth , SubscriptionController.getSubscriptionById);
router.get('/subscription-admin/:subscriptionId' , admin , SubscriptionController.getSubscriptionById);
router.put('/updateSubscription' , auth , SubscriptionController.updateSubscription);
router.put('/updateSubscription-admin' , admin , SubscriptionController.updateSubscription);
router.post('/disabelSubscription' , admin , SubscriptionController.disableSubscription);
router.post('/enableSubscription' , admin , SubscriptionController.enableSubscription);
router.delete('/deleteSubscription/:subscriptionId' , admin , SubscriptionController.deleteSubscription);

module.exports = router;