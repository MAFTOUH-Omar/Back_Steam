const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const Package = require('../models/packages.model');

const SubscriptionController = {
    createSubscriptionDeviceType: async (req, res) => {
        try {
            const { userId, packageId, deviceType, m3uDetails, macDetails, activeCodeDetails } = req.body;

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId)) {
                return res.status(400).json({ error: 'Invalid user or package ID' });
            }

            let existingSubscription = await Subscription.findOne({ user: userId, packageId, deviceType });

            let deviceDetails;
            switch (deviceType) {
                case 'm3u':
                    if (!m3uDetails || !m3uDetails.userName || !m3uDetails.password || m3uDetails.userName.length !== 15 || m3uDetails.password.length !== 10) {
                        return res.status(400).json({ error: 'Invalid M3U details format' });
                    }
                    deviceDetails = {
                        userName: m3uDetails.userName || null,
                        password: m3uDetails.password || null,
                    };
                    break;
                case 'mac':
                    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
                    if (!macDetails || !macRegex.test(macDetails.macAddress)) {
                        return res.status(400).json({ error: 'Invalid MAC address format' });
                    }
                    deviceDetails = {
                        macAddress: macDetails.macAddress || null,
                    };
                    break;
                case 'activeCode':
                    if (!activeCodeDetails || !activeCodeDetails.code || activeCodeDetails.code.length !== 12 || !/^\d+$/.test(activeCodeDetails.code)) {
                        return res.status(400).json({ error: 'Invalid active code format' });
                    }
                    deviceDetails = {
                        code: activeCodeDetails.code || null,
                    };
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid device type' });
            }

            const package = await Package.findById(packageId);
            if (!package) {
                return res.status(404).json({ error: 'Package not found' });
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
                return res.status(200).json({ message: 'Subscription details updated successfully', subscription: existingSubscription });
            }

            await newSubscription.save();

            res.status(201).json({ message: 'Subscription created successfully', subscription: newSubscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating/updating subscription' });
        }
    },
    countSubscriptions: async (req, res) => {
        try {
            const totalSubscriptions = await Subscription.countDocuments();
            res.status(200).json({ totalSubscriptions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error counting subscriptions' });
        }
    },
    createSubscriptionLiveBouquet: async (req, res) => {
        try {
            const { userId, packageId, subscriptionId, liveBouquet, seriesBouquet, vodBouquet } = req.body;

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId) || !mongoose.Types.ObjectId.isValid(subscriptionId)) {
                return res.status(400).json({ error: 'Invalid user, package, or subscription ID' });
            }

            const subscription = await Subscription.findOne({ _id: subscriptionId, user: userId, packageId });

            if (!subscription) {
                return res.status(404).json({ error: 'Subscription not found' });
            }

            subscription.liveBouquet = liveBouquet || subscription.liveBouquet;
            subscription.seriesBouquet = seriesBouquet || subscription.seriesBouquet;
            subscription.vodBouquet = vodBouquet || subscription.vodBouquet;
            
            await subscription.save();

            res.status(200).json({ message: 'Live Bouquet, Series Bouquet, and VOD Bouquet updated successfully', subscription });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error updating liveBouquet, seriesBouquet, and vodBouquet' });
        }
    },
};

module.exports = SubscriptionController;