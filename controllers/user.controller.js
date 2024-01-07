const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const i18n = require('../config/i18n'); 

const UserController = {
    countUser: async (req, res) => {
        try {
            const userCount = await User.countDocuments();
            res.status(200).json({ count: userCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('user.countUser.error') });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find({}, '-password');
            const usersWithSubscriptionCount = await Promise.all(
                users.map(async (user) => {
                    const subscriptionCount = await Subscription.countDocuments({ user: user._id });
                    return { ...user._doc, subscriptionCount };
                })
            );

            res.status(200).json({ users: usersWithSubscriptionCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('user.getAllUsers.error') });
        }
    },
    BanneUser: async (req, res) => {
        const userId = req.params.id;
        try {
            const updatedUser = await User.findByIdAndUpdate(userId, { banned: true }, { new: true });
        
            if (updatedUser) {
                await Subscription.updateMany({ user: userId }, { $set: { activationStatus: false, paymentStatus: 'failed' } });
        
                res.status(200).json({ message: i18n.__('user.deleteUser.success') });
            } else {
                res.status(404).json({ error: i18n.__('user.deleteUser.notFound') });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('user.deleteUser.error') });
        }
    },
    AuthorizeUser: async (req, res) => {
        const userId = req.params.id;
        try {
            const updatedUser = await User.findByIdAndUpdate(userId, { banned: false }, { new: true });
        
            if (updatedUser) {
                await Subscription.updateMany({ user: userId }, { $set: { activationStatus: false, paymentStatus: 'pending' } });
        
                res.status(200).json({ message: i18n.__('user.authorizeUser.success') });
            } else {
                res.status(404).json({ error: i18n.__('user.authorizeUser.notFound') });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('user.authorizeUser.error') });
        }
    },            
    getUserById: async (req, res) => {
        const userId = req.params.id;

        try {
            const user = await User.findById(userId, '-password');

            if (user) {
                res.status(200).json({ user });
            } else {
                res.status(404).json({ error: i18n.__('user.getUserById.notFound') });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('user.getUserById.error') });
        }
    },
};

module.exports = UserController;