const express = require('express');
const router = express.Router();
const Reseller = require('../controllers/reseller.controller');

router.post('/updateResellerStatus/:userId/', async (req, res) => {
    try {
        const userId = req.params.userId;
        const updatedResellerStatus = await Reseller.updateResellerStatus(userId);
        res.status(200).json(updatedResellerStatus);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;