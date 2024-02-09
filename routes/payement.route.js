const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middlewares');
const Payement = require('../controllers/payement.controller');

// Route pour effectuer un paiement PayPal
router.post('/paypal/:idSubscription' , auth , async (req, res) => {
    const idSubscription = req.params.idSubscription;

    try {
        const result = await Payement.PayPal(idSubscription);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors du paiement PayPal :', error);
        res.status(500).json({ success: false, message: 'Une erreur est survenue lors du paiement PayPal.' });
    }
});

module.exports = router;