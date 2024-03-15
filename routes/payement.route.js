const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middlewares');
const { Paypal, Crypto } = require('../controllers/payement.controller');

// PayPal
router.post('/paypal/pay/:subscriptionId', auth ,async (req, res) => {
    try {
        const result = await Paypal.paySubscription(req, res, req.params.subscriptionId);
        if (result.success && result.approvalUrl) {
            return res.redirect(result.approvalUrl);
        } else {
            return res.json(result);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Une erreur est survenue lors du paiement PayPal.' });
    }
});
router.get('/paypal/success/', Paypal.success);
router.get('/paypal/cancel', Paypal.cancel);

// Crypto
router.post('/crypto/pay/:subscriptionId' , async (req, res) => {
    try {
        const result = await Crypto.paySubscription(req, res, req.params.subscriptionId);
        if (result.hostedUrl) {
            return res.redirect(result.hostedUrl);
        } else {
            return res.json(result);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Une erreur est survenue lors du paiement avec crypto-monnaie.' });
    }
});
router.get('/crypto/success', Crypto.success);
router.get('/crypto/cancel', Crypto.cancel);

module.exports = router;