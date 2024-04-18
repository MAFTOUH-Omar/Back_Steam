createSubscription: async (req, res) => {
    try {
        const { userId, packageId, deviceType, m3uDetails, macDetails, activeCodeDetails, subscriptionId, liveBouquet, seriesBouquet, vodBouquet } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(packageId) || (subscriptionId && !mongoose.Types.ObjectId.isValid(subscriptionId))) {
            return res.status(400).json({ error: i18n.__('subscription.createSubscription.invalidIds') });
        }

        let existingSubscription;
        let deviceDetails;

        if (subscriptionId) {
            existingSubscription = await Subscription.findOne({ _id: subscriptionId, user: userId, packageId });
            if (!existingSubscription) {
                return res.status(404).json({ error: i18n.__('subscription.createSubscription.notFound') });
            }
        }

        switch (deviceType) {
            case 'm3u':
                if (!m3uDetails || !m3uDetails.userName || !m3uDetails.password || m3uDetails.userName.length !== 8 || m3uDetails.password.length !== 8) {
                    return res.status(400).json({ error: i18n.__('subscription.createSubscription.invalidM3uFormat') });
                }
                deviceDetails = {
                    userName: m3uDetails.userName || null,
                    password: m3uDetails.password || null,
                };
                break;
            case 'mac':
                const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
                if (!macDetails || !macRegex.test(macDetails.macAddress)) {
                    return res.status(400).json({ error: i18n.__('subscription.createSubscription.invalidMacFormat') });
                }
                deviceDetails = {
                    macAddress: macDetails.macAddress || null,
                };
                break;
            case 'activeCode':
                if (!activeCodeDetails || !activeCodeDetails.code || activeCodeDetails.code.length !== 12 || !/^\d+$/.test(activeCodeDetails.code)) {
                    return res.status(400).json({ error: i18n.__('subscription.createSubscription.invalidActiveCodeFormat') });
                }
                deviceDetails = {
                    code: activeCodeDetails.code || null,
                };
                break;
            default:
                return res.status(400).json({ error: i18n.__('subscription.createSubscription.invalidDeviceType') });
        }

        const package = await Package.findById(packageId);
        if (!package) {
            return res.status(404).json({ error: i18n.__('subscription.createSubscription.notFound') });
        }

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
            return res.status(200).json({ message: i18n.__('subscription.createSubscription.updateSuccess'), subscription: existingSubscription });
        }

        let newSubscription = new Subscription({
            user: userId,
            packageId,
            deviceType,
            deviceDetails,
            liveBouquet: [],
            seriesBouquet: [],
            vodBouquet: [],
            paymentMethod: 'paypal',
        });

        if (subscriptionId) {
            newSubscription._id = subscriptionId;
        }

        if (liveBouquet || seriesBouquet || vodBouquet) {
            newSubscription.liveBouquet = liveBouquet || [];
            newSubscription.seriesBouquet = seriesBouquet || [];
            newSubscription.vodBouquet = vodBouquet || [];
        }

        await newSubscription.save();

        // Paiement de l'abonnement
        const paymentResult = await paySubscription(req, res, newSubscription._id);
        if (!paymentResult.success) {
            return res.status(500).json({ error: i18n.__('subscription.createSubscription.paymentError'), message: paymentResult.message });
        }

        res.status(201).json({ message: i18n.__('subscription.createSubscription.createSuccess'), subscription: newSubscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: i18n.__('subscription.createSubscription.error') });
    }
}