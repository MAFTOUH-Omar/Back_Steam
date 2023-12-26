const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const Package = require('../models/packages.model');
const i18n = require('../config/i18n'); 

const SubscriptionController = {
    createSubscriptionDeviceType: async (req, res) => {
        try {
            const { userId, packageId, deviceType, m3uDetails, macDetails, activeCodeDetails } = req.body;

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId)) {
                return res.status(400).json({ error: i18n.__('subscription.createSubscriptionDeviceType.invalidUserPackageId') });
            }

            let existingSubscription = await Subscription.findOne({ user: userId, packageId, deviceType });

            let deviceDetails;
            switch (deviceType) {
                case 'm3u':
                    if (!m3uDetails || !m3uDetails.userName || !m3uDetails.password || m3uDetails.userName.length !== 8 || m3uDetails.password.length !== 8) {
                        return res.status(400).json({ error: i18n.__('subscription.createSubscriptionDeviceType.invalidM3uFormat') });
                    }
                    deviceDetails = {
                        userName: m3uDetails.userName || null,
                        password: m3uDetails.password || null,
                    };
                    break;
                case 'mac':
                    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
                    if (!macDetails || !macRegex.test(macDetails.macAddress)) {
                        return res.status(400).json({ error: i18n.__('subscription.createSubscriptionDeviceType.invalidMacFormat') });
                    }
                    deviceDetails = {
                        macAddress: macDetails.macAddress || null,
                    };
                    break;
                case 'activeCode':
                    if (!activeCodeDetails || !activeCodeDetails.code || activeCodeDetails.code.length !== 12 || !/^\d+$/.test(activeCodeDetails.code)) {
                        return res.status(400).json({ error: i18n.__('subscription.createSubscriptionDeviceType.invalidActiveCodeFormat') });
                    }
                    deviceDetails = {
                        code: activeCodeDetails.code || null,
                    };
                    break;
                default:
                    return res.status(400).json({ error: i18n.__('subscription.createSubscriptionDeviceType.invalidDeviceType') });
            }

            const package = await Package.findById(packageId);
            if (!package) {
                return res.status(404).json({ error: i18n.__('subscription.createSubscriptionDeviceType.notFound') });
            }

            if (deviceType === 'activeCode') {
                deviceDetails.activeCode = {
                    code: activeCodeDetails.code || null,
                };
            } else if (deviceType === 'mac') {
                deviceDetails.mac = {
                    macAddress: macDetails.macAddress || null,
                };
            } else if (deviceType === 'm3u') {
                deviceDetails.m3u = {
                    userName: m3uDetails.userName || null,
                    password: m3uDetails.password || null,
                };
            }

            const newSubscription = new Subscription({
                user: userId,
                packageId,
                deviceType,
                deviceDetails,
                liveBouquet: [],
                seriesBouquet: [],
                vodBouquet: [],
                paymentMethod: 'paypal',
            });

            if (existingSubscription) {
                if (deviceType === 'activeCode') {
                    existingSubscription.deviceDetails.activeCode = {
                        code: activeCodeDetails.code || null,
                    };
                } else if (deviceType === 'mac') {
                    existingSubscription.deviceDetails.mac = {
                        macAddress: macDetails.macAddress || null,
                    };
                } else if (deviceType === 'm3u') {
                    existingSubscription.deviceDetails.m3u = {
                        userName: m3uDetails.userName || null,
                        password: m3uDetails.password || null,
                    };
                }
                await existingSubscription.save();
                return res.status(200).json({ message: i18n.__('subscription.createSubscriptionDeviceType.updateSuccess'), subscription: existingSubscription });
            }

            await newSubscription.save();

            res.status(201).json({ message: i18n.__('subscription.createSubscriptionDeviceType.createSuccess') , subscription: newSubscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.createSubscriptionDeviceType.error') });
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
    createSubscriptionLiveBouquet: async (req, res) => {
        try {
            const { userId, packageId, subscriptionId, liveBouquet, seriesBouquet, vodBouquet } = req.body;

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId) || !mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: i18n.__('subscription.createSubscriptionLiveBouquet.invalidUserPackageSubscriptionId') });
            }

            const subscription = await Subscription.findOne({ _id: subscriptionId, user: userId, packageId });

            if (!subscription) {
                return res.status(404).json({ error: i18n.__('subscription.createSubscriptionLiveBouquet.notFound') });
            }

            subscription.liveBouquet = liveBouquet || subscription.liveBouquet;
            subscription.seriesBouquet = seriesBouquet || subscription.seriesBouquet;
            subscription.vodBouquet = vodBouquet || subscription.vodBouquet;
            
            await subscription.save();

            res.status(200).json({ message: i18n.__('subscription.createSubscriptionLiveBouquet.updateSuccess'), subscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('subscription.createSubscriptionLiveBouquet.error') });
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
    
            const subscription = await Subscription.findById(subscriptionId).populate('packageId').exec();
    
            if (!subscription) {
                return res.status(404).json({ error: i18n.__('subscription.getSubscriptionById.notFound') });
            }
    
            res.status(200).json({ subscription });
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
};

module.exports = SubscriptionController;