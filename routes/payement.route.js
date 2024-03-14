const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middlewares');
const Payement = require('../controllers/payement.controller');

// Route pour effectuer un paiement PayPal
router.post('/paypal/pay/:subscriptionId', async (req, res) => {
    try {
        const result = await Payement.paySubscription(req, res, req.params.subscriptionId);
        if (result.success && result.approvalUrl) {
            return res.redirect(result.approvalUrl);
        } else {
            return res.json(result);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Une erreur est survenue lors du paiement PayPal.' });
    }
});

// Route pour le succès du paiement PayPal
router.get('/paypal/success/', Payement.success);
// Route pour l'annulation du paiement PayPal
router.get('/paypal/cancel', Payement.cancel);

module.exports = router;