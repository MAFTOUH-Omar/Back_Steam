const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const mongoose = require("mongoose");

const Packages = {
    AddPackagesToService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const { name, price, duration, etat } = req.body;

            const existingService = await Service.findById(serviceId);
            if (!existingService) {
                return res.status(404).json({ error: 'Service non trouvé' });
            }

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
    },
    PackagesByServiceId : async(req, res) => {
        try {
            const { serviceId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({ error: 'Invalid serviceId' });
            }
      
            const packages = await Package.find({ serviceId }).populate('serviceId', 'name');

            res.status(200).json({ packages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération des packages par serviceId' });
        }
    }
}

module.exports = Packages;