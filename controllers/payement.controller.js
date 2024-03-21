const Subscription = require('../models/subscription.model');
const paypal = require('paypal-rest-sdk');
const { google } = require('googleapis');
require('dotenv').config();

// Paypal Config
paypal.configure({
    'mode': process.env.PAYPAL_MODE,
    'client_id': process.env.PAYPAL_CLIENT_KEY,
    'client_secret': process.env.PAYPAL_SECRET_KEY
});

// Binance Config 
const binance = require('node-binance-api')().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY,
    family: 4,
});

// Google config 
const googlePayConfig = {
    environment: 'TEST',
    merchantInfo: {
        merchantId: 'VOTRE_ID_COMMERCANT',
        merchantName: 'Nom de votre commerce',
    },
    apiVersion: 'v2', // Version de l'API Google Pay à utiliser
    apiOptions: {
        // Options spécifiques à l'API, par exemple, si vous avez besoin de fonctionnalités spéciales ou de configurations particulières
    },
    // Autres configurations nécessaires pour le client Google Pay
};


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

            // Obtenez les filtres de prix pour le symbole de trading
            const symbol = 'BTCUSDT';
            const exchangeInfo = await binance.exchangeInfo(symbol);
            
            // Vérifiez si exchangeInfo est défini et contient les données attendues
            if (!exchangeInfo || !exchangeInfo.symbols || exchangeInfo.symbols.length === 0) {
                throw new Error('Données de exchangeInfo non disponibles ou invalides.');
            }

            const priceFilter = exchangeInfo.symbols[0].filters.find(f => f.filterType === 'PRICE_FILTER');

            // Calculez le nouveau prix acceptable en fonction du dernier prix
            const lastPrice = await binance.prices(symbol);
            const acceptablePrice = parseFloat(lastPrice[symbol]) * (1 + 0.01);

            // Formatez le prix spécifié pour avoir trois décimales
            const specifiedPrice = (acceptablePrice / 1000).toFixed(3);

            // Vérifiez si le prix spécifié dans l'ordre respecte les filtres de prix
            if (specifiedPrice < parseFloat(priceFilter.minPrice) || specifiedPrice > parseFloat(priceFilter.maxPrice)) {
                // Le prix spécifié est en dehors de la plage autorisée par les filtres de prix
                return res.status(400).json({ success: false, message: 'Le prix spécifié ne respecte pas les filtres de prix de Binance.' });
            }

            // Placez un ordre d'achat avec le nouveau prix acceptable
            const quantity = 1;
            const response = await binance.buy(symbol, quantity, specifiedPrice);

            // Vérifiez si l'ordre a été passé avec succès
            if (response && response.status && response.status === 'FILLED') {
                subscription.paymentMethod = 'crypto';
                subscription.paymentStatus = 'success';
                subscription.paymentDate = new Date();
                subscription.activationStatus = true;
                await subscription.save();
                return res.status(200).json({ success: true, message: 'Paiement réussi avec Binance.' });
            } else {
                subscription.paymentMethod = 'crypto';
                subscription.paymentStatus = 'failed';
                subscription.activationStatus = false;
                await subscription.save();
                return res.status(400).json({ success: false, message: 'Le paiement avec Binance a échoué.' });
            }
        } catch (err) {
            // Gestion des erreurs
            console.error('Erreur lors de la tentative de paiement avec Binance:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la tentative de paiement avec Binance.', err });
        }
    }
};

const GooglePay = {
    paySubscription : async function (req , res , subscriptionId) {

    }
}

module.exports = { Paypal , Crypto };