const Service = require('../models/service.model');
const Package = require('../models/packages.model');
const i18n = require('../config/i18n'); 

const Services = {
    All : async (req, res) => {
        try {
            const services = await Service.find();

            const servicesWithPackages = await Promise.all(
                services.map(async (service) => {
                    const packages = await Package.find({ serviceId: service._id });

                    return {
                        _id: service._id,
                        name: service.name,
                        packageCount: packages.length,
                        packages: packages
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
};

module.exports = Services;