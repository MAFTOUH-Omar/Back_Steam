const Service = require('../models/service.model');
const Package = require('../models/packages.model');

const Packages = {
    AddPackagesToService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const { name, price, duration, etat } = req.body;

            const existingService = await Service.findById(serviceId);
            if (!existingService) {
                return res.status(404).json({ error: 'Service non trouvé' });
            }

            // Créez un nouveau package
            const newPackage = new Package({
                name,
                price,
                duration,
                etat,
                serviceId: existingService._id,
            });

            await newPackage.save();

            res.status(201).json({ message: 'Package ajouté avec succès' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout du package' });
        }
    }
}

module.exports = Packages;