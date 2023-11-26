const User = require('../models/user.model');

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
            res.status(200).json({ users });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
        }
    },
};

module.exports = UserController;