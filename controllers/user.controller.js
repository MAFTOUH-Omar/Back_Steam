const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

const UserController = {
    countUser: async (req, res) => {
        try {
            const userCount = await User.countDocuments();
            res.status(200).json({ count: userCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors du calcul du nombre de utilisateur' });
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
            res.status(500).json({ error: 'Error retrieving users and subscription counts' });
        }
    },
    deleteUser: async (req, res) => {
        const userId = req.params.id;

        try {
            const deletedUser = await User.findByIdAndDelete(userId);

            if (deletedUser) {
                res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
            } else {
                res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
        }
    },
    getUserById: async (req, res) => {
        const userId = req.params.id;

        try {
            const user = await User.findById(userId, '-password');

            if (user) {
                res.status(200).json({ user });
            } else {
                res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
        }
    },
};

module.exports = UserController;