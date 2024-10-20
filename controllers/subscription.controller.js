const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const Package = require('../models/packages.model');
const i18n = require('../config/i18n'); 
const { Paypal , Stripe } = require('./payement.controller')

const SubscriptionController = {
    createSubscription: async (req, res) => {
        try {
            const { userId, packageId, paymentMethod, deviceType, m3uDetails, macDetails, activeCodeDetails, liveBouquet, seriesBouquet, vodBouquet } = req.body;
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId)) {
                return res.status(400).json({ error: 'Les identifiants de l\'utilisateur ou du package ne sont pas valides.' });
            }
    
            let existingSubscription;
            let deviceDetails;
    
            // Vérifie si la requête contient un ID d'abonnement existant
            if (req.body.subscriptionId) {
                existingSubscription = await Subscription.findOne({ _id: req.body.subscriptionId, user: userId, packageId });
                if (!existingSubscription) {
                    return res.status(404).json({ error: 'Abonnement non trouvé.' });
                }
            }
    
            // Validation des détails du périphérique en fonction du type de périphérique
            switch (deviceType) {
                case 'm3u':
                    deviceDetails = {
                        m3u: {
                            userName: m3uDetails.userName || null,
                            password: m3uDetails.password || null,
                        },
                    };
                    break;
                case 'mac':
                    deviceDetails = {
                        mac: {
                            macAddress: macDetails.macAddress || null,
                        },
                    };
                    break;
                case 'activeCode':
                    deviceDetails = {
                        activeCode: {
                            code: activeCodeDetails.code || null,
                        },
                    };
                    break;
                default:
                    return res.status(400).json({ error: 'Type de périphérique invalide.' });
            }
    
            const package = await Package.findById(packageId);
            if (!package) {
                return res.status(404).json({ error: 'Package non trouvé.' });
            }

            let subscriptionData = {
                user: userId,
                packageId,
                deviceType,
                deviceDetails,
                liveBouquet: liveBouquet || [],
                seriesBouquet: seriesBouquet || [],
                vodBouquet: vodBouquet || [],
                paymentMethod: paymentMethod,
            };
    
            // Mise à jour de l'abonnement existant si un ID d'abonnement est fourni dans la requête
            if (existingSubscription) {
                switch (deviceType) {
                    case 'activeCode':
                        existingSubscription.deviceDetails.activeCode = {
                            code: activeCodeDetails.code || null,
                        };
                        break;
                    case 'mac':
                        existingSubscription.deviceDetails.mac = {
                            macAddress: macDetails.macAddress || null,
                        };
                        break;
                    case 'm3u':
                        existingSubscription.deviceDetails.m3u = {
                            userName: m3uDetails.userName || null,
                            password: m3uDetails.password || null,
                        };
                        break;
                    default:
                        break;
                }
                await existingSubscription.save();
                return res.status(200).json({ message: 'Mise à jour de l\'abonnement avec succès.', subscription: existingSubscription });
            }
    
            // Création d'un nouvel abonnement
            const newSubscription = await Subscription.create(subscriptionData);
    
            // Attribution de l'ID de l'abonnement si fourni dans la requête
            if (req.body.subscriptionId) {
                newSubscription._id = req.body.subscriptionId;
            }
    
            // Mise à jour des bouquets s'il y en a dans la requête
            if (liveBouquet || seriesBouquet || vodBouquet) {
                newSubscription.liveBouquet = liveBouquet || [];
                newSubscription.seriesBouquet = seriesBouquet || [];
                newSubscription.vodBouquet = vodBouquet || [];
            }
    
            await newSubscription.save();
    
            // Paiement de l'abonnement
            let paymentResult;
            let approvalUrl;
            if (paymentMethod === 'paypal') {
                paymentResult = await Paypal.paySubscription(req, res, newSubscription._id);
                if (!paymentResult.success) {
                    return res.status(500).json({ error: 'Erreur lors du paiement de l\'abonnement.', message: paymentResult.message });
                }
                approvalUrl = paymentResult.link;
            } else if (paymentMethod === 'stripe') {
                paymentResult = await Stripe.paySubscription(req, newSubscription._id);
                if (!paymentResult.success) {
                    return res.status(500).json({ error: 'Erreur lors du paiement de l\'abonnement.', message: paymentResult.message });
                }
                approvalUrl = paymentResult.link;
            }
    
            res.status(201).json({ message: 'Abonnement créé avec succès.', subscription: newSubscription, link: approvalUrl });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement.' });
        }
    },        
    countSubscriptions: async (req, res) => {
        try {
            const totalSubscriptions = await Subscription.countDocuments();
            res.status(200).json({ totalSubscriptions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.countSubscriptions.error') });
        }
    },
    getAllSubscriptionsByUserId: async (req, res) => {
        try {
            const { userId } = req.query;
        
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: i18n.__('subscription.getAllSubscriptionsByUserId.invalidUserId')  });
            }
        
            const subscriptions = await Subscription.find({ user: userId }).populate('packageId').exec();
        
            res.status(200).json({ subscriptions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.getAllSubscriptionsByUserId.error')  });
        }
    },         
    getSubscriptionById: async (req, res) => {
        try {
            const { subscriptionId } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: i18n.__('subscription.getSubscriptionById.invalidSubscriptionId') });
            }
    
            const subscription = await Subscription.findById(subscriptionId)
                .populate('packageId')
                .exec();
    
            if (!subscription) {
                return res.status(404).json({ error: i18n.__('subscription.getSubscriptionById.notFound') });
            }
    
            const sortedLiveBouquet = subscription.liveBouquet.sort((a, b) => (b.selected ? 1 : -1));
            const sortedSeriesBouquet = subscription.seriesBouquet.sort((a, b) => (b.selected ? 1 : -1));
            const sortedVodBouquet = subscription.vodBouquet.sort((a, b) => (b.selected ? 1 : -1));
    
            res.status(200).json({
                subscription: {
                    ...subscription._doc,
                    liveBouquet: sortedLiveBouquet,
                    seriesBouquet: sortedSeriesBouquet,
                    vodBouquet: sortedVodBouquet,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.getSubscriptionById.error') });
        }
    },        
    updateSubscription: async (req, res) => {
        try {
            const { userId, packageId, subscriptionId, deviceDetails, liveBouquet, seriesBouquet, vodBouquet } = req.body;
            if (
                !mongoose.Types.ObjectId.isValid(userId) ||
                !mongoose.Types.ObjectId.isValid(packageId) ||
                !mongoose.Types.ObjectId.isValid(subscriptionId)
            ) {
                return res.status(400).json({ error: i18n.__('subscription.updateSubscription.invalidUserPackageSubscriptionId')});
            }
            const subscription = await Subscription.findOne({ _id: subscriptionId, user: userId, packageId });
            if (!subscription) {updateSubscription
                return res.status(404).json({ error: i18n.__('subscription.updateSubscription.notFound') });
            }
            if (deviceDetails) {
                if (deviceDetails.activeCode) {
                    if (
                        !deviceDetails.activeCode.code ||
                        deviceDetails.activeCode.code.length !== 12 ||
                        !/^\d+$/.test(deviceDetails.activeCode.code)
                    ) {
                        return res.status(400).json({ error: i18n.__('subscription.updateSubscription.invalidActiveCodeFormat') });
                    }
                }
                if (deviceDetails.m3u) {
                    if (
                        !deviceDetails.m3u.userName ||
                        !deviceDetails.m3u.password ||
                        deviceDetails.m3u.userName.length !== 8 ||
                        deviceDetails.m3u.password.length !== 8
                    ) {
                        return res.status(400).json({ error: i18n.__('subscription.updateSubscription.invalidM3uFormat') });
                    }
                    }
                if (
                    deviceDetails.mac &&
                    deviceDetails.mac.macAddress &&
                    !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(deviceDetails.mac.macAddress)
                ) {
                    return res.status(400).json({ error:i18n.__('subscription.updateSubscription.invalidMacFormat') });
                }
                subscription.deviceDetails = deviceDetails;
            }
            if (liveBouquet) {
                subscription.liveBouquet = liveBouquet;
                }
            if (seriesBouquet) {
                subscription.seriesBouquet = seriesBouquet;
            }
            if (vodBouquet) {
                subscription.vodBouquet = vodBouquet;
            }
            if (!deviceDetails && !liveBouquet && !seriesBouquet && !vodBouquet) {
                return res.status(200).json({ message: i18n.__('subscription.updateSubscription.noModification'), subscription });
            }
            await subscription.save();
            res.status(200).json({ message: i18n.__('subscription.updateSubscription.success'), subscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.updateSubscription.error') });
        }
    },
    getAllSubscriptionsWithUserAndPackage: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const searchQuery = req.query.search ? req.query.search.trim() : '';
            const filter = {};
    
            if (searchQuery) {
                const regex = new RegExp(searchQuery, 'i');
                filter.$or = [
                    { 'user.FirstName': regex },
                    { 'user.LastName': regex },
                    { 'packageId.name': regex }
                ];
            }

            const totalSubscriptions = await Subscription.countDocuments(filter).exec();
            const subscriptions = await Subscription.find(filter)
                .populate('user')
                .populate('packageId')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
    
            res.status(200).json({
                subscriptions,
                totalDocs: totalSubscriptions,
                totalPages: Math.ceil(totalSubscriptions / limit),
                currentPage: page,
                limit: limit,
            });
        } catch (error) {
            res.status(500).json({ error: 'Error lors de connexion' });
        }
    },
    disableSubscription: async (req, res) => {
        try {
                const { subscriptionId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: 'ID d\'abonnement invalide' });
            }

            const updatedSubscription = await Subscription.findByIdAndUpdate(
                subscriptionId,
                { $set: { paymentStatus: 'failed', activationStatus: false } },
                { new: true }
            );

            res.status(200).json({ message: 'Statut d\'abonnement mis à jour avec succès', subscription: updatedSubscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut d\'abonnement' });
        }
    },
    enableSubscription: async (req, res) => {
        try {
                const { subscriptionId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: 'ID d\'abonnement invalide' });
                }

            const updatedSubscription = await Subscription.findByIdAndUpdate(
                subscriptionId,
                { $set: { paymentStatus: 'pending', activationStatus: false } },
                { new: true }
            );

            res.status(200).json({ message: 'Statut d\'abonnement mis à jour avec succès', subscription: updatedSubscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut d\'abonnement' });
        }
    },
    deleteSubscription: async (req, res) => {
        try {
            const { subscriptionId } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: 'Invalid Subscription Id' });
            }
    
            const subscription = await Subscription.findByIdAndDelete(subscriptionId);
    
            if (!subscription) {
                return res.status(404).json({ error: 'Introuvable Subscription' });
            }
    
            res.status(200).json({ message: 'Supprimer avec succès', deletedSubscription: subscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'exécution' });
        }
    },        
};

module.exports = SubscriptionController;