const express = require('express');
const router = express.Router();
const Statistic = require('../controllers/statistic.controller');
const admin = require('../middlewares/admin.middlewares');

router.get('/subscription', admin , async (req, res) => {
    try {
        const statistics = await Statistic.getSubscriptionStatistics();
        res.json(statistics);
    } catch (error) {
        console.error('Error in subscription statistics route:', error);
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
});

router.get('/user-sub', admin , async (req, res) => {
    try {
        const statistics = await Statistic.getUserAndSubscriptionCounts();
        res.json(statistics);
    } catch (error) {
        console.error('Error in user and subscriptionCounts statistics route:', error);
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
});

module.exports = router;