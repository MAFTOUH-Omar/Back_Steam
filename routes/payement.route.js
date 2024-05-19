const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middlewares');
const { Paypal , UnpaidPaypal , Stripe } = require('../controllers/payement.controller');

// PayPal
router.post('/paypal/pay/:subscriptionId' , async (req, res) => {
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

// UnPaid PayPal
router.post('/paypal-unpaid/pay/:subscriptionId' , async (req, res) => {
    try {
        const result = await UnpaidPaypal.paySubscription(req, res, req.params.subscriptionId);
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
router.get('/paypal-unpaid/success/', UnpaidPaypal.success);
router.get('/paypal-unpaid/cancel', UnpaidPaypal.cancel);

// Stripe
router.post('/stripe/pay/:subscriptionId' , async (req, res) => {
    try {
        const result = await Stripe.paySubscription(req, req.params.subscriptionId);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors du paiement Stripe :', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/stripe/success', Stripe.success);
router.get('/stripe/cancel', Stripe.cancel);

// UnpaidStripe
router.post('/stripe-unpaid/pay/:subscriptionId' , async (req, res) => {
    try {
        const result = await Stripe.paySubscription(req, req.params.subscriptionId);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors du paiement Stripe :', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/stripe-unpaid/success', Stripe.success);
router.get('/stripe-unpaid/cancel', Stripe.cancel);

module.exports = router;