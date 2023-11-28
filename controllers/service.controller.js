const Service = require('../models/service.model');
const Package = require('../models/packages.model');

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
                        packages: packages,
                    };
                })
            );

            res.status(200).json(servicesWithPackages);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération des services' });
        }
    },  
    countServices: async (req, res) => {
        try {
            const serviceCount = await Service.countDocuments();
            res.status(200).json({ count: serviceCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors du calcul du nombre de services' });
        }
    },
    getServiceById: async (req, res) => {
        try {
            const { serviceId } = req.params;

            const service = await Service.findById(serviceId);

            res.status(200).json(service);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de la récupération du service par ID' });
        }
    },
};

module.exports = Services;