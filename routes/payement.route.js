const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middlewares');
const { Paypal, Crypto } = require('../controllers/payement.controller');

// PayPal
router.post('/paypal/pay/:subscriptionId', auth, async (req, res) => {
    try {
        const result = await Paypal.paySubscription(req, res, req.params.subscriptionId);
        if (result.success && result.approvalUrl) {
            return res.redirect(result.approvalUrl);
        } else {
            return res.json(result);
        }
    } catch (error) {
        console.error('Erreur lors du paiement PayPal :', error);
        return res.status(500).json({ success: false, message: 'Une erreur est survenue lors du paiement PayPal.' });
    }
});
router.get('/paypal/success/', Paypal.success);
router.get('/paypal/cancel', Paypal.cancel);

// Crypto
router.post('/crypto/pay/:subscriptionId', async (req, res) => {
    try {
        const subscriptionId = req.params.subscriptionId;
        await Crypto.paySubscription(req, res, subscriptionId);
    } catch (err) {
        console.error('Erreur lors de la tentative de paiement avec Binance :', err);
        return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la tentative de paiement avec Binance.' });
    }
});
module.exports = router;