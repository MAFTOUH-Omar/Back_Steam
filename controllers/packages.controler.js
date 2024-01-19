const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const i18n = require('../config/i18n'); 

const id = new ObjectId()

const Packages = {
    getAvailablePackagesForService: async (req, res) => {
        try {
            const { serviceId } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({ error: i18n.__('package.getAvailablePackagesForService.invalidSericeId') });
            }
    
            const availablePackages = await Package.find({ etat: 'Available', serviceId: new mongoose.Types.ObjectId(serviceId) })
                .populate({
                    path: 'serviceId',
                    select: 'name ServicePicture',
                });
    
            const formattedPackages = availablePackages.map(package => {
                const servicePicture = package.serviceId.ServicePicture ? package.serviceId.ServicePicture.split('/').pop() : null;
                return {
                    ...package.toObject(),
                    serviceId: {
                        ...package.serviceId.toObject(),
                        ServicePicture: servicePicture,
                    },
                };
            });
    
            res.status(200).json({ packages: formattedPackages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('package.getAvailablePackagesForService.error') });
        }
    },    
    disablePackage: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const disabledPackage = await Package.findByIdAndUpdate(serviceId, { $set: { etat: 'Not Available' } }, { new: true });

            res.status(200).json({ package: disabledPackage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('package.disablePackage.error') });
        }
    },
    enablePackage: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const enabledPackage = await Package.findByIdAndUpdate(serviceId, { $set: { etat: 'Available' } }, { new: true });

            res.status(200).json({ package: enabledPackage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('package.enablePackage.error') });
        }
    },
    PackagesByServiceId : async(req, res) => {
        try {
            const { serviceId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({ error: i18n.__('package.PackagesByServiceId.invalidSericeId') });
            }
      
            const packages = await Package.find({ serviceId }).populate('serviceId' , 'name');

            res.status(200).json({ packages });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('package.PackagesByServiceId.error') });
        }
    },
    countPackages : async (req, res) => {
        try {
            const packageCount = await Package.countDocuments();
            res.status(200).json({ count: packageCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('package.countPackages.error') });
        }
    },
    getPackageById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: i18n.__('package.getPackageById.invalidPackageId') });
            }
        
            const package = await Package.findById(id).populate('serviceId', 'name');
        
            if (!package) {
                return res.status(404).json({ status: 'fail', message: i18n.__('package.getPackageById.notFound') });
            }
        
            res.status(200).json({ status: 'success', data: { package } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: i18n.__('package.getPackageById.error') });
        }
    },
    updatePackagePrice: async (req, res) => {
        try {
            const { id } = req.params;
            const { price } = req.body;

            // Vérifier si l'id est un ObjectId valide
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid package Id" });
            }

            // Vérifier si le prix est fourni
            if (!price) {
                return res.status(400).json({ error: "Missing Price" });
            }

            // Mettre à jour le prix du package
            const updatedPackage = await Package.findByIdAndUpdate(
                id,
                { $set: { price } },
                { new: true } // Renvoyer le document mis à jour
            );

            // Vérifier si le package existe
            if (!updatedPackage) {
                return res.status(404).json({ status: 'fail', message: "Package not found" });
            }

            res.status(200).json({ status: 'success', data: { package: updatedPackage } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: "Error lors de connection" });
        }
    },
}

module.exports = Packages;