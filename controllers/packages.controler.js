const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const mongoose = require("mongoose");

const Packages = {
    getAvailablePackagesForService: async (req, res) => {
        try {
            const { serviceId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({ error: 'Invalid serviceId' });
            }

            const availablePackages = await Package.find({ etat: 'Available', serviceId: mongoose.Types.ObjectId(serviceId) }).populate('serviceId', 'name');

            res.status(200).json({ packages: availablePackages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération des packages.' });
        }
    },
    disablePackage: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const disabledPackage = await Package.findByIdAndUpdate(serviceId, { $set: { etat: 'Not Available' } }, { new: true });

            res.status(200).json({ package: disabledPackage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la désactivation du package.' });
        }
    },
    enablePackage: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const enabledPackage = await Package.findByIdAndUpdate(serviceId, { $set: { etat: 'Available' } }, { new: true });

            res.status(200).json({ package: enabledPackage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'activation du package.' });
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
    },
    countPackages : async (req, res) => {
        try {
            const packageCount = await Package.countDocuments();
            res.status(200).json({ count: packageCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error counting packages' });
        }
    },
    getPackageById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid package ID' });
            }
        
            const package = await Package.findById(id).populate('serviceId', 'name');
        
            if (!package) {
                return res.status(404).json({ status: 'fail', message: 'Package not found' });
            }
        
            res.status(200).json({ status: 'success', data: { package } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: 'Internal server error' });
        }
    },
}

module.exports = Packages;