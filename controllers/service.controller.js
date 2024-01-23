const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const i18n = require('../config/i18n'); 

const Services = {
    All: async (req, res) => {
        try {
            const services = await Service.find();
    
            const servicesWithPackages = await Promise.all(
                services.map(async (service) => {
                    const allPackages = await Package.find({ serviceId: service._id });
                    const availablePackages = allPackages.filter(package => package.etat === 'Available');
    
                    const servicePicture = service.ServicePicture ? service.ServicePicture.split('/').pop() : null;
    
                    return {
                        _id: service._id,
                        name: service.name,
                        active: service.active,
                        packageCount: availablePackages.length,
                        packages: availablePackages,
                        ServicePicture: servicePicture,
                    };
                })
            );
    
            res.status(200).json(servicesWithPackages);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('service.All.error') });
        }
    },             
    countServices: async (req, res) => {
        try {
            const serviceCount = await Service.countDocuments();
            res.status(200).json({ count: serviceCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('service.countServices.error') });
        }
    },
    getServiceById: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const service = await Service.findById(serviceId);

            res.status(200).json(service);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('service.getServiceById.error') });
        }
    },
    getAllServicesWithCredit: async (req, res) => {
        try {
            const services = await Service.find();
            res.status(200).json({ status: 'success', data: services });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 'fail', message: i18n.__('service.getAllServicesWithCredit.error') });
        }
    },
    enableService : async (req , res) => {
        try {
            const { _id } = req.params;
    
            const service = await Service.findById(_id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }
    
            if (!service.active) {
                service.active = true;
                await service.save();
                return res.status(200).json({ message: "Service activated successfully", service });
            }
    
            return res.status(400).json({ message: "Service is already active" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    disableService : async (req , res) => {
        try {
            const { _id } = req.params;
    
            const service = await Service.findById(_id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }
    
            if (service.active) {
                service.active = false;
                await service.save();
                return res.status(200).json({ message: "Service deactivated successfully", service });
            }
    
            return res.status(400).json({ message: "Service is already deactivated" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getEnableSerive : async (req , res) => {
        try {
            const services = await Service.find({ active: true });
    
            const servicesWithPackages = await Promise.all(
                services.map(async (service) => {
                    const allPackages = await Package.find({ serviceId: service._id });
                    const availablePackages = allPackages.filter(package => package.etat === 'Available');
                    const servicePicture = service.ServicePicture ? service.ServicePicture.split('/').pop() : null;
    
                    return {
                        _id: service._id,
                        name: service.name,
                        active: service.active,
                        packageCount: availablePackages.length,
                        packages: availablePackages,
                        ServicePicture: servicePicture,
                    };
                })
            );
    
            res.status(200).json(servicesWithPackages);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('service.All.error') });
        }
    },
    addServiceImage: async (req, res) => {
        try {
            const { _id } = req.params;
            const { filename } = req.file || {};
    
            const service = await Service.findById(_id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }
    
            service.ServicePicture = filename ? `Picture/service_picture/${filename}` : "";
            await service.save();
    
            res.status(200).json({ message: "Service image added successfully", service });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    updateServiceDescription: async (req, res) => {
        try {
            const { _id } = req.params;
            const { description } = req.body;

            const service = await Service.findById(_id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }

            service.description = description;
            await service.save();

            res.status(200).json({ message: "Service description updated successfully", service });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },   
};

module.exports = Services;