const axios = require('axios');
const qs = require('qs');
const Package = require('../models/packages.model');
const Service = require('../models/service.model');
const Channel = require('../models/channel.model');
require('dotenv').config();

const MegaController = {
    Authentification: async () => {
        try {
            const data = qs.stringify({
                grant_type: 'password',
                client_id: process.env.MEGA_CLIENT_ID,
                client_secret: process.env.MEGA_CLIENT_SECRET,
                username: process.env.MEGA_CLIENT_USERNAME,
                password: process.env.MEGA_CLIENT_PASSWORD,
                scope: process.env.MEGA_SCOPE
            });

            const response = await axios.post(
                process.env.MEGA_API_URL_AUTH + '/oauth/token',
                data,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }
            );

            return response.data.access_token;
        } catch (error) {
            const errorMessage = error.response
                ? error.response.data
                : error.message;

            return {
                error: 'Authentication failed',
                details: errorMessage
            };
        }
    } , 
    Packages: async (req, res) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return res.status(401).json({ error: token.details });
            }
    
            const response = await axios.get(process.env.MEGA_API_URL_DATA + '/packages?per_page=' + process.env.MEGA_PER_PAGE, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            const packages = response.data.data;
            const updateResults = [];
    
            // Chercher le service "mega"
            const megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            if (!megaService) {
                return res.status(404).json({ error: 'Service mega not found' });
            }
    
            // Supprimer les packages avec `package_id: 0` associés au service "mega"
            const deleteResult = await Package.deleteMany({ package_id: 0, serviceId: megaService._id });
            
            updateResults.push({
                deletedCount: deleteResult.deletedCount,
                message: `Packages with package_id: 0 deleted for service mega.`
            });
    
            for (let pkg of packages) {
                const { id: package_id, name, period, period_type } = pkg;
    
                // Convertir la durée en jours si `period_type` est 'month' ou 'year'
                let duration = period;
                if (period_type === 'month') {
                    duration = period * 30; // Conversion mois en jours
                } else if (period_type === 'year') {
                    duration = period * 365; // Conversion années en jours
                }
    
                // Chercher le package existant par `package_id`
                let existingPackage = await Package.findOne({ package_id });
    
                if (existingPackage) {
                    // Mettre à jour seulement le nom et la durée
                    existingPackage.name = name;
                    existingPackage.duration = duration;
                    existingPackage.serviceId = megaService._id;
                    await existingPackage.save();
                    updateResults.push({
                        package_id: existingPackage.package_id,
                        status: 'updated',
                        name: existingPackage.name
                    });
                } else {
                    // Créer un nouveau package si introuvable
                    const newPackage = new Package({
                        package_id,
                        name,
                        price: 0, // Défaut pour les nouveaux packages
                        currency: 'USD', // Monnaie par défaut
                        duration: duration,
                        etat: 'Not Available', // État par défaut
                        serviceId: megaService._id
                    });
                    await newPackage.save();
                    updateResults.push({
                        package_id: newPackage.package_id,
                        status: 'created',
                        name: newPackage.name
                    });
                }
            }
    
            return res.status(200).json({
                message: 'Packages processed successfully',
                results: updateResults
            });
    
        } catch (error) {
            return res.status(500).json({
                error: 'Error updating packages',
                details: error.message
            });
        }
    },
    Bouquets: async (req, res) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return res.status(401).json({ error: token.details });
            }
    
            const response = await axios.get(process.env.MEGA_API_URL_DATA + '/bouquets?filters[is_children]&per_page=' + process.env.MEGA_PER_PAGE, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            const bouquets = response.data.data;
            const updateResults = [];
    
            // Chercher le service "mega"
            const megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            if (!megaService) {
                return res.status(404).json({ error: 'Service mega not found' });
            }
    
            // Supprimer les bouquets avec `bouquet_id: 0` associés au service "mega" dans chaque tableau
            const deleteResult = await Channel.updateMany(
                { serviceId: megaService._id },
                {
                    $pull: {
                        LiveBouquet: { bouquet_id: 0 },
                        Vod: { bouquet_id: 0 },
                        SerieBouquet: { bouquet_id: 0 }
                    }
                }
            );
    
            updateResults.push({
                deletedCount: deleteResult.modifiedCount,
                message: `Bouquets with bouquet_id: 0 deleted for service mega.`
            });
    
            // Parcourir chaque bouquet
            for (const bouquet of bouquets) {
                const { id, bouquet_name, type } = bouquet;
    
                // Rechercher le bouquet existant dans la collection Channel
                let channel = await Channel.findOne({ serviceId: megaService._id });
    
                // Si le channel n'existe pas, en créer un nouveau
                if (!channel) {
                    channel = new Channel({
                        serviceId: megaService._id,
                        LiveBouquet: [],
                        Vod: [],
                        SerieBouquet: []
                    });
                }
    
                // Mise à jour du bouquet si il existe déjà
                const result = await Channel.updateOne(
                    {
                        serviceId: megaService._id,
                        $or: [
                            { 'LiveBouquet.bouquet_id': id },
                            { 'SerieBouquet.bouquet_id': id },
                            { 'Vod.bouquet_id': id }
                        ]
                    },
                    {
                        $set: {
                            [`${type === 'live' ? 'LiveBouquet' : type === 'serie' ? 'SerieBouquet' : 'Vod'}.$[elem].name`]: bouquet_name
                        }
                    },
                    { arrayFilters: [{ 'elem.bouquet_id': id }] }
                );
    
                // Si aucun document n'a été mis à jour, cela signifie qu'il faut créer un nouveau bouquet
                if (result.matchedCount === 0) {
                    const newBouquet = {
                        bouquet_id: id,
                        name: bouquet_name,
                        selected: false,
                        active: true
                    };
    
                    // Ajouter le nouveau bouquet au bon tableau
                    if (type === 'live') {
                        channel.LiveBouquet.push(newBouquet);
                    } else if (type === 'serie') {
                        channel.SerieBouquet.push(newBouquet);
                    } else if (type === 'movie') {
                        channel.Vod.push(newBouquet);
                    }
    
                    // Enregistrer le nouveau channel ou le channel modifié
                    await channel.save();
                }
            }
    
            return res.status(200).json({
                message: "Bouquets updated successfully!",
                results: updateResults
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour des bouquets :", error);
            return res.status(500).json({ error: 'Error updating bouquets', details: error.message });
        }
    }
       
};

module.exports = MegaController;