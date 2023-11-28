const Theme = require('../models/theme.model');

const themeController = {
    updateTheme: async (req, res) => {
        try {
            const { Mybg , MybgHover } = req.body;

            // // Recherche du thème existant
            const theme = await Theme.findOne();

            // // Si le thème n'existe pas, créez-le
            // if (!theme) {
            //     const newTheme = await Theme.create({ Mybg, MybgHover });
            //     return res.status(201).json({ status: 'success', data: { theme: newTheme } });
            // }

            theme.Mybg = Mybg || theme.Mybg;
            theme.MybgHover = MybgHover || theme.MybgHover;

            await theme.save();

            res.status(200).json({ status: 'success', data: { theme } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: 'Internal server error' });
        }
    },    
    getTheme: async (req, res) => {
        try {
            const theme = await Theme.findOne();

            if (!theme) {
                return res.status(404).json({ status: 'fail', message: 'Theme not found' });
            }
            res.status(200).json({ status: 'success', data: { Mybg: theme.Mybg, MybgHover: theme.MybgHover } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: 'Internal server error' });
        }
    },
};

module.exports = themeController;
