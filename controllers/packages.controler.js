const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const mongoose = require("mongoose");

const Packages = {
    AddPackagesToService: async (req, res) => {
        try {
            const { name, price , duration, etat , serviceId} = req.body;

            const existingPackage = await Package.findOne({ name });
            if (existingPackage) {
                return res.status(400).json({ status: 'fail', message: 'Package name already exists' });
            }

            const newPackage = await Package.create({
                serviceId,
                name,
                price,
                duration,
                etat,
            });

            res.status(201).json({
                status: 'success',
                message: 'Service add with success',
                data: { package: newPackage },
            });
        } catch (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message,
            });
        }
    },
    EditPackage : async (req, res) => {
        try {
            const existingPackage = await Package.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
            if (existingPackage) {
                return res.status(400).json({status: 'fail', message: 'Package name already exists',});
            }
      
            const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            });

            if (!updatedPackage) {
                return res.status(404).json({status: 'fail',message: 'Package not found',});
            }
        
            res.status(200).json({status: 'success',data: {package: updatedPackage,},});
        } catch (err) {
            res.status(400).json({ status: 'fail',message: err.message,});
        }
    },
    DeletePackage : async (req, res) => {
        try {
            const deletedPackage = await Package.findByIdAndDelete(req.params.id);
            if (!deletedPackage) {
                return res.status(404).json({status: 'fail',message: 'Package not found',});
            }
            res.status(204).json({status: 'success',data: null,});
        } catch (err) {
            res.status(400).json({status: 'fail',message: err.message,});
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
}

module.exports = Packages;