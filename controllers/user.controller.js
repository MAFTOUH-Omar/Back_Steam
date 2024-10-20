const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const i18n = require('../config/i18n'); 
const generateRandomPassword = require('../helpers/generatePassword')
const bcrypt = require('bcryptjs');
const sendCredentialsEmail = require("../mail/passwordReset.mail");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|\W).+$/;

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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || parseInt(process.env.PAGINATION_LIMIT) || 5;
            const searchQuery = req.query.search ? req.query.search.trim() : '';
    
            const query = searchQuery
                ? {
                    $or: [
                        { FirstName: { $regex: new RegExp(searchQuery, 'i') } },
                        { LastName: { $regex: new RegExp(searchQuery, 'i') } },
                    ]
                }
                : {};
    
            const options = {
                page: page,
                limit: limit,
                select: '-password',
                lean: true,
                sort: { created: -1 }
            };
    
            const result = await User.paginate(query, options);
    
            const usersWithSubscriptionCount = await Promise.all(
                result.docs.map(async (user) => {
                    const subscriptionCount = await Subscription.countDocuments({ user: user._id });
                    return { ...user, subscriptionCount };
                })
            );
    
            res.status(200).json({
                users: usersWithSubscriptionCount,
                totalDocs: result.totalDocs,
                totalPages: result.totalPages,
                currentPage: result.page,
                limit: result.limit,
            });
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
    updateUserById: async (req, res) => {
        const userId = req.params.id;
        const updates = req.body;

        try {
            const existingUser = await User.findById(userId);

            if (!existingUser) {
                return res.status(404).json({ error: "User not Found" });
            }

            if (updates.password) {
                if (updates.password.length < 8 || !updates.password.match(passwordRegex)) {
                    return res.status(400).json({ error: "Invalid password format" });
                }
            }

            Object.keys(updates).forEach((key) => {
                if (existingUser.schema.paths[key]) {
                    existingUser[key] = updates[key];
                }
            });

            const updatedUser = await existingUser.save();

            res.status(200).json({ user: updatedUser });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },
    passwordReset: async (req, res) => {
        const userId = req.params.id;
    
        try {
            const userToUpdate = await User.findById(userId);
    
            if (!userToUpdate) {
                return res.status(404).json({ error: "User not Found" });
            }
    
            const newPassword = generateRandomPassword();
    
            userToUpdate.password = await bcrypt.hash(newPassword, 10);
            await userToUpdate.save();
    
            await sendCredentialsEmail({
                email: userToUpdate.email,
                password: newPassword,
                firstName: userToUpdate.FirstName,
                lastName: userToUpdate.LastName
            });
    
            res.status(200).json({ message: "Password reset email sent successfully.", passwordRest: newPassword });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },    
};

module.exports = UserController;