const Subscription = require('../models/subscription.model');
const paypal = require('paypal-rest-sdk');
require('dotenv').config();
const axios = require('axios');

// Paypal Config
paypal.configure({
    'mode': process.env.PAYPAL_MODE,
    'client_id': process.env.PAYPAL_CLIENT_KEY,
    'client_secret': process.env.PAYPAL_SECRET_KEY
});

const Paypal = {
    paySubscription: async function(req, res, subscriptionId) {
        try {
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }
            
            const package = subscription.packageId;
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": process.env.PAYPAL_RETURN_URL + '?subscriptionId=' + subscriptionId ,
                    "cancel_url": process.env.PAYPAL_CANCEL_URL + '?subscriptionId=' + subscriptionId
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            name: package.name,
                            sku: subscription._id.toString(),
                            price: package.price.toFixed(2),
                            currency: package.currency,
                            quantity: 1
                        }]
                    },
                    "amount": {
                        currency: package.currency,
                        total: package.price.toFixed(2)
                    },
                    "description": "Achat d\'abonnement" + package.name 
                }]
            };
    
            // Créer une promesse pour gérer la réponse de PayPal
            return new Promise((resolve, reject) => {
                paypal.payment.create(create_payment_json, async (error, payment) => {
                    if (error) {
                        console.error(error);   
                        reject({ success: false, message: 'Une erreur est survenue lors de la création du paiement PayPal.' });
                    } else {
                        // Mettre à jour les champs dans le modèle de souscription
                        let approvalUrl;
                        for(let i = 0 ; i < payment.links.length ; i++){
                            if(payment.links[i].rel === 'approval_url'){
                                approvalUrl = payment.links[i].href;
                                break;
                            }
                        }
                        if (approvalUrl) {
                            // Rediriger vers l'URL d'approbation avant d'envoyer la réponse JSON
                            resolve({ success: true, link : approvalUrl });
                        } else {
                            // Si l'URL d'approbation n'est pas trouvée, rejeter la promesse
                            reject({ success: false, message: 'Lien d\'approbation PayPal non trouvé.' });
                        }
                    }
                });
            });                       
        } catch (err) {
            console.error('Erreur lors de la tentative de paiement PayPal:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la tentative de paiement PayPal.' });
        }
    },
    success: async function(req, res) {
        try {
            // Récupérer subscriptionId à partir de la requête
            const subscriptionId = req.query.subscriptionId;
    
            // Vérifier si subscriptionId est présent
            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
            }
    
            // Récupérer l'abonnement
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }
            
            // Récupérer les informations de paiement depuis la requête
            const payerId = req.query.PayerID;
            const paymentId = req.query.paymentId;
    
            // Mettre à jour les informations de paiement dans le modèle de souscription
            subscription.paymentMethod = 'paypal';
            subscription.paymentStatus = 'success';
            subscription.paymentId = paymentId;
            subscription.paymentDate = new Date();
            subscription.activationStatus = true;
    
            // Enregistrer les modifications dans la base de données
            await subscription.save();
            res.redirect(process.env.PAYPAL_REDIRECT + subscriptionId + '?pay=true');
        } catch (err) {
            console.error('Erreur lors de la récupération de l\'abonnement:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' });
        }
    },    
    cancel: async function(req, res) {
        // Récupérer subscriptionId à partir de la requête
        const subscriptionId = req.query.subscriptionId;
        // Vérifier si subscriptionId est présent
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
        }

        // Récupérer l'abonnement
        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
        }

        // Mettre à jour les informations de paiement dans le modèle de souscription
        subscription.paymentMethod = 'paypal';
        subscription.paymentStatus = 'failed';
        subscription.activationStatus = false;

        // Enregistrer les modifications dans la base de données
        await subscription.save();
        res.redirect(process.env.PAYPAL_REDIRECT + subscriptionId + '?pay=false');
    }
};

const Crypto = {
    paySubscription: async function(req, res, subscriptionId) {
        try {
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }

            // Définissez les détails du paiement
            const paymentDetails = {
                subscriptionId: subscription._id,
                amount: subscription.packageId.price,
                cryptoCurrency: 'BTC',
            };

            // Effectuez la requête vers l'API CryptoAPIs.io pour traiter le paiement
            const response = await axios.post('https://api.cryptoapis.io/v1/bc/btc/mainnet/payments/create', paymentDetails, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.CRYPTO_API_KEY , 
                }
            });

            // Vérifiez si le paiement a été réussi
            if (response.status === 200 && response.data.success) {
                // Mettez à jour les informations de paiement dans le modèle de souscription
                subscription.paymentMethod = 'crypto';
                subscription.paymentStatus = 'success';
                subscription.paymentDate = new Date();
                subscription.activationStatus = true;

                // Enregistrez les modifications dans la base de données
                await subscription.save();

                // Répondez en conséquence
                return res.status(200).json({ success: true, message: 'Paiement réussi avec crypto.' });
            } else {
                // Mettez à jour les informations de paiement dans le modèle de souscription
                subscription.paymentMethod = 'crypto';
                subscription.paymentStatus = 'failed';
                subscription.activationStatus = false;

                // Enregistrez les modifications dans la base de données
                await subscription.save();

                // Répondez en conséquence
                return res.status(400).json({ success: false, message: 'Le paiement avec crypto a échoué.' });
            }
        } catch (err) {
            console.error('Erreur lors de la tentative de paiement avec crypto:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la tentative de paiement avec crypto.' });
        }
    }
};

module.exports = { Paypal , Crypto };