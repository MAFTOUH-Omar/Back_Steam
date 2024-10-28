const Subscription = require('../models/subscription.model');
const paypal = require('paypal-rest-sdk');
require('dotenv').config();
const MegaController = require('../api/mega.api');

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

const Paypal = {
    paySubscription: async function(req, res, subscriptionId, extend) {
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
                    "return_url": process.env.PAYPAL_RETURN_URL + '?subscriptionId=' + subscriptionId + '&extend=' + extend ,
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
            const { subscriptionId , extend , payerId , paymentId } = req.query;

            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
            }

            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }

            subscription.paymentMethod = 'paypal';
            subscription.paymentStatus = 'success';
            subscription.paymentId = paymentId;
            subscription.paymentDate = new Date();
            subscription.activationStatus = true;

            const allBouquets = [
                ...subscription.liveBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...subscription.seriesBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...subscription.vodBouquet.map(item => parseInt(item.bouquet_id, 10))
            ].filter(Number.isInteger);

            const deviceType = subscription.deviceType;
            const packageId = parseInt(subscription.packageId.package_id, 10);
            const megaClientId = parseInt(process.env.MEGA_CLIENT_ID, 10);
            const isExtend = extend === 'true';
            
            const createSubscription = async () => {
                let result;
            
                switch (deviceType) {
                    case 'm3u':
                        if (isExtend) {
                            result = await MegaController.M3uExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.M3uCreate(
                                subscription.deviceDetails.m3u.userName,
                                subscription.deviceDetails.m3u.password,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
                    case 'mac':
                        if (isExtend) {
                            result = await MegaController.MagExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.MagCreate(
                                subscription.deviceDetails.mac.macAddress,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
            
                    case 'activeCode':
                        if (isExtend) {
                            result = await MegaController.ActivecodeExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.ActivecodeCreate(
                                1,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
            
                    default:
                        throw new Error('Type de dispositif non supporté.');
                }
            
                if (result && !result.error && result.data) {
                    subscription.subscription_id = result.data.id;
            
                    if (deviceType === 'activeCode' && result.data.code) {
                        subscription.deviceDetails.activeCode.code = result.data.code;
                    }
                } else {
                    subscription.paymentStatus = 'failed';
                    console.error("Error in subscription creation:", result.error || "Unknown error");
                }
            
                return result;
            };
            
            const result = await createSubscription();
            if (result.error) {
                return res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement', details: result.details });
            }

            await subscription.save();
            res.redirect(extend ? process.env.UNPAID_PAYPAL_REDIRECT : `${process.env.PAYPAL_REDIRECT}${subscriptionId}?pay=true`);
        } catch (err) {
            console.error('Erreur lors de la récupération de l\'abonnement:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' });
        }
    },
    cancel: async function(req, res) {
        const subscriptionId = req.query.subscriptionId;
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
        }

        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
        }

        subscription.paymentMethod = 'paypal';
        subscription.paymentStatus = 'failed';
        subscription.activationStatus = false;

        await subscription.save();
        res.redirect(process.env.PAYPAL_REDIRECT + subscriptionId + '?pay=false');
    }
};

const UnpaidPaypal = {
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
                    "return_url": process.env.UNPAID_PAYPAL_RETURN_URL + '?subscriptionId=' + subscriptionId ,
                    "cancel_url": process.env.UNPAID_PAYPAL_CANCEL_URL + '?subscriptionId=' + subscriptionId
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

            return new Promise((resolve, reject) => {
                paypal.payment.create(create_payment_json, async (error, payment) => {
                    if (error) {
                        console.error(error);
                        reject({ success: false, message: 'Une erreur est survenue lors de la création du paiement PayPal.' });
                    } else {
                        let approvalUrl;
                        for(let i = 0 ; i < payment.links.length ; i++){
                            if(payment.links[i].rel === 'approval_url'){
                                approvalUrl = payment.links[i].href;
                                break;
                            }
                        }
                        if (approvalUrl) {
                            resolve({ success: true, link : approvalUrl });
                        } else {
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
            const { subscriptionId , payerId , paymentId } = req.query;

            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
            }

            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }

            subscription.paymentMethod = 'paypal';
            subscription.paymentStatus = 'success';
            subscription.paymentId = paymentId;
            subscription.paymentDate = new Date();
            subscription.activationStatus = true;

            const liveBouquet = subscription.liveBouquet || [];
            const seriesBouquet = subscription.seriesBouquet || [];
            const vodBouquet = subscription.vodBouquet || [];
            const allBouquets = [
                ...liveBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...seriesBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...vodBouquet.map(item => parseInt(item.bouquet_id, 10))
            ].filter(Number.isInteger);
    
            const deviceType = subscription.deviceType;
            const packageId = parseInt(subscription.packageId.package_id, 10);
            const megaClientId = parseInt(process.env.MEGA_CLIENT_ID, 10);
            
            const createSubscription = async () => {
                let result;
            
                switch (deviceType) {
                    case 'm3u':
                        result = await MegaController.M3uCreate(
                            subscription.deviceDetails.m3u.userName,
                            subscription.deviceDetails.m3u.password,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;
                    case 'mac':
                        result = await MegaController.MagCreate(
                            subscription.deviceDetails.mac.macAddress,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;
            
                    case 'activeCode':
                        result = await MegaController.ActivecodeCreate(
                            1,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;
            
                    default:
                        throw new Error('Type de dispositif non supporté.');
                }
            
                if (result && !result.error && result.data) {
                    subscription.subscription_id = result.data.id;
            
                    if (deviceType === 'activeCode' && result.data.code) {
                        subscription.deviceDetails.activeCode.code = result.data.code;
                    }
                } else {
                    subscription.paymentStatus = 'failed';
                    console.error("Error in subscription creation:", result.error || "Unknown error");
                }
            
                return result;
            };
            
            const result = await createSubscription();
            if (result.error) {
                return res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement', details: result.details });
            }

            await subscription.save();
            res.redirect(process.env.UNPAID_PAYPAL_REDIRECT);
        } catch (err) {
            console.error('Erreur lors de la récupération de l\'abonnement:', err);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' });
        }
    },
    cancel: async function(req, res) {
        const subscriptionId = req.query.subscriptionId;
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
        }

        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
        }

        subscription.paymentMethod = 'paypal';
        subscription.paymentStatus = 'failed';
        subscription.activationStatus = false;

        await subscription.save();
        res.redirect(process.env.UNPAID_PAYPAL_REDIRECT);
    }
}

// Configiration Stripe
require("dotenv").config();
const stripe = require("stripe")("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

const Stripe = {
    paySubscription: async function(req, subscriptionId , extend) {
        try {
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                throw new Error('Abonnement non trouvé.');
            }

            const package = subscription.packageId;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: package.currency,
                            product_data: {
                                name: package.name,
                            },
                            unit_amount: package.price.toFixed(2) * 100,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.STRIPE_RETURN_URL}?subscriptionId=${subscriptionId}&extend=${extend}`,
                cancel_url: `${process.env.STRIPE_CANCEL_URL}?subscriptionId=${subscriptionId}`,
            });

            return { success: true, link: session.url };
        } catch (error) {
            console.error('Erreur lors de la tentative de paiement Stripe:', error);
            throw new Error('Une erreur est survenue lors de la tentative de paiement Stripe.');
        }
    },
    success: async function(req, res) {
        try {
            const { subscriptionId , extend , payerId , paymentId } = req.query;

            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
            }
    
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }
    
            subscription.paymentMethod = 'stripe';
            subscription.paymentStatus = 'success';
            subscription.paymentDate = new Date();
            subscription.paymentId = paymentId;
            subscription.activationStatus = true;

            const liveBouquet = subscription.liveBouquet || [];
            const seriesBouquet = subscription.seriesBouquet || [];
            const vodBouquet = subscription.vodBouquet || [];
            const allBouquets = [
                ...liveBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...seriesBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...vodBouquet.map(item => parseInt(item.bouquet_id, 10))
            ].filter(Number.isInteger);
    
            const deviceType = subscription.deviceType;
            const packageId = parseInt(subscription.packageId.package_id, 10);
            const isExtend = extend === 'true';
            const megaClientId = parseInt(process.env.MEGA_CLIENT_ID, 10);
            
            const createSubscription = async () => {
                let result;
            
                switch (deviceType) {
                    case 'm3u':
                        if (isExtend) {
                            result = await MegaController.M3uExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.M3uCreate(
                                subscription.deviceDetails.m3u.userName,
                                subscription.deviceDetails.m3u.password,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
                    case 'mac':
                        if (isExtend) {
                            result = await MegaController.MagExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.MagCreate(
                                subscription.deviceDetails.mac.macAddress,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
            
                    case 'activeCode':
                        if (isExtend) {
                            result = await MegaController.ActivecodeExtend(subscription.subscription_id, packageId, 1, megaClientId);
                        } else {
                            result = await MegaController.ActivecodeCreate(
                                1,
                                packageId,
                                1,
                                0,
                                1,
                                'all',
                                'This subscription created through the store',
                                '098765432',
                                allBouquets,
                                megaClientId
                            );
                        }
                        break;
            
                    default:
                        throw new Error('Type de dispositif non supporté.');
                }
            
                if (result && !result.error && result.data) {
                    subscription.subscription_id = result.data.id;
            
                    if (deviceType === 'activeCode' && result.data.code) {
                        subscription.deviceDetails.activeCode.code = result.data.code;
                    }
                } else {
                    subscription.paymentStatus = 'failed';
                    console.error("Error in subscription creation:", result.error || "Unknown error");
                }
            
                return result;
            };
            
            const result = await createSubscription();
            if (result.error) {
                return res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement', details: result.details });
            }
    
            await subscription.save();
    
            res.redirect(extend ? process.env.UNPAID_STRIPE_REDIRECT : process.env.STRIPE_REDIRECT + subscriptionId + '?pay=true');
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'abonnement:', error);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' });
        }
    },
    cancel: async function(req, res) {
        const subscriptionId = req.query.subscriptionId;
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
        }
    
        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
        }
    
        subscription.paymentMethod = 'stripe';
        subscription.paymentStatus = 'failed';
        subscription.activationStatus = false;
    
        await subscription.save();
    
        res.redirect(process.env.STRIPE_REDIRECT + subscriptionId + '?pay=false');
    }
}

const UnpaidStripe = {
    paySubscription: async function(req, subscriptionId) {
        try {
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                throw new Error('Abonnement non trouvé.');
            }

            const package = subscription.packageId;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: package.currency,
                            product_data: {
                                name: package.name,
                            },
                            unit_amount: package.price.toFixed(2) * 100,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.UNPAID_STRIPE_RETURN_URL}?subscriptionId=${subscriptionId}`,
                cancel_url: `${process.env.UNPAID_STRIPE_CANCEL_URL}?subscriptionId=${subscriptionId}`,
            });

            return { success: true, link: session.url };
        } catch (error) {
            console.error('Erreur lors de la tentative de paiement Stripe:', error);
            throw new Error('Une erreur est survenue lors de la tentative de paiement Stripe.');
        }
    },
    success: async function(req, res) {
        try {
            const { subscriptionId , payerId , paymentId } = req.query;
            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
            }
    
            const subscription = await Subscription.findById(subscriptionId).populate('packageId');
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
            }
    
            subscription.paymentMethod = 'stripe';
            subscription.paymentStatus = 'success';
            subscription.paymentDate = new Date();
            subscription.paymentId = paymentId;
            subscription.activationStatus = true;

            const liveBouquet = subscription.liveBouquet || [];
            const seriesBouquet = subscription.seriesBouquet || [];
            const vodBouquet = subscription.vodBouquet || [];
            const allBouquets = [
                ...liveBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...seriesBouquet.map(item => parseInt(item.bouquet_id, 10)),
                ...vodBouquet.map(item => parseInt(item.bouquet_id, 10))
            ].filter(Number.isInteger);
    
            const deviceType = subscription.deviceType;
            const packageId = parseInt(subscription.packageId.package_id, 10);
            const megaClientId = parseInt(process.env.MEGA_CLIENT_ID, 10);
            
            const createSubscription = async () => {
                let result;
            
                switch (deviceType) {
                    case 'm3u':
                        result = await MegaController.M3uCreate(
                            subscription.deviceDetails.m3u.userName,
                            subscription.deviceDetails.m3u.password,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;
                    case 'mac':
                        result = await MegaController.MagCreate(
                            subscription.deviceDetails.mac.macAddress,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;    
                    case 'activeCode':
                        result = await MegaController.ActivecodeCreate(
                            1,
                            packageId,
                            1,
                            0,
                            1,
                            'all',
                            'This subscription created through the store',
                            '098765432',
                            allBouquets,
                            megaClientId
                        );
                        break;
                    default:
                        throw new Error('Type de dispositif non supporté.');
                }
            
                if (result && !result.error && result.data) {
                    subscription.subscription_id = result.data.id;
            
                    if (deviceType === 'activeCode' && result.data.code) {
                        subscription.deviceDetails.activeCode.code = result.data.code;
                    }
                } else {
                    subscription.paymentStatus = 'failed';
                    console.error("Error in subscription creation:", result.error || "Unknown error");
                }
            
                return result;
            };
            
            const result = await createSubscription();
            if (result.error) {
                return res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement', details: result.details });
            }
    
            await subscription.save();
    
            res.redirect(process.env.UNPAID_STRIPE_REDIRECT);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'abonnement:', error);
            return res.status(500).json({ success: false, message: 'Une erreur est survenue lors de la récupération de l\'abonnement.' });
        }
    },
    cancel: async function(req, res) {
        const subscriptionId = req.query.subscriptionId;
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Identifiant d\'abonnement manquant dans la requête.' });
        }
    
        const subscription = await Subscription.findById(subscriptionId).populate('packageId');
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Abonnement non trouvé.' });
        }
    
        subscription.paymentMethod = 'stripe';
        subscription.paymentStatus = 'failed';
        subscription.activationStatus = false;
    
        await subscription.save();
    
        res.redirect(process.env.UNPAID_STRIPE_REDIRECT);
    }
}

module.exports = { Paypal , Stripe , UnpaidPaypal , UnpaidStripe};