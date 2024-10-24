const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
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
    Service: async (req, res) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return res.status(401).json({ error: token.details });
            }
    
            const response = await axios.get(process.env.MEGA_API_URL_DATA + '/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            const credit = response.data.credit || 0;
    
            // Chercher le service "Mega"
            let megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            
            if (!megaService) {
                // Si le service n'existe pas, créer un nouveau service
                megaService = new Service({
                    name: 'Mega',
                    credit: credit,
                    active: true,
                    description: 'Service for Mega API',
                    ServicePicture: '',
                });
                
                // Sauvegarder le nouveau service
                await megaService.save();
                return res.status(200).json({
                    message: 'New Mega service created successfully',
                    results: megaService
                });
            } else {
                // Si le service existe, mettre à jour le crédit
                megaService.credit = credit;
                
                await megaService.save();
                return res.status(200).json({
                    message: 'Mega service credit updated successfully',
                    results: megaService
                });
            }
        } catch (error) {
            return res.status(500).json({
                error: 'Error processing service',
                details: error.message
            });
        }
    },
    Packages: async (req, res) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return res.status(401).json({ error: token.details });
            }
    
            // Generate the timestamp
            const timestamp = Math.floor(Date.now() / 1000);
    
            // Generate the HMAC-SHA256 signature
            const path = '/packages';
            const secret = process.env.FIRST_PARTY_SECRET;
            const firstPartyId = process.env.FIRST_PARTY_ID;
    
            const signatureMessage = `${path}${timestamp}${firstPartyId}`;
            const signature = crypto
                .createHmac('sha256', secret)
                .update(signatureMessage)
                .digest('hex');
    
            // Make a request to the API using First Party Authentication
            const response = await axios.get(`${process.env.MEGA_API_URL_DATA}${path}?per_page=${process.env.MEGA_PER_PAGE}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'First-Party-Id': firstPartyId,
                    'First-Party-Signature': signature,
                    'First-Party-Timestamp': timestamp,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
    
            const packages = response.data.data;
            const updateResults = [];
    
            // Fetch the "mega" service
            const megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            if (!megaService) {
                return res.status(404).json({ error: 'Service mega not found' });
            }
    
            // Delete packages with `package_id: 0` associated with the "mega" service
            const deleteResult = await Package.deleteMany({ package_id: 0, serviceId: megaService._id });
    
            updateResults.push({
                deletedCount: deleteResult.deletedCount,
                message: `Packages with package_id: 0 deleted for service mega.`
            });
    
            // Process each package from the API response
            for (let pkg of packages) {
                const { id: package_id, name, period, period_type } = pkg;
    
                // Convert period to days if `period_type` is 'month' or 'year'
                let duration = period;
                if (period_type === 'month') {
                    duration = period * 30; // Convert months to days
                } else if (period_type === 'year') {
                    duration = period * 365; // Convert years to days
                }
    
                // Find existing package by `package_id`
                let existingPackage = await Package.findOne({ package_id });
    
                if (existingPackage) {
                    // Update name and duration for existing packages
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
                    // Create new package if not found
                    const newPackage = new Package({
                        package_id,
                        name,
                        price: 0, // Default price for new packages
                        currency: 'USD', // Default currency
                        duration: duration,
                        etat: 'Not Available', // Default status
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
    
            // Chercher le service "mega"
            const megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            if (!megaService) {
                return res.status(404).json({ error: 'Service mega not found' });
            }
    
            // Récupérer tous les packages associés au service "mega"
            const packages = await Package.find({ serviceId: megaService._id });
    
            const updateResults = [];
    
            // Supprimer les bouquets avec `bouquet_id: 0` associés au service "mega"
            const deleteResult = await Channel.updateMany(
                { packageId: { $in: packages.map(pkg => pkg._id) } },
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
                message: `Bouquets with bouquet_id: 0 deleted for packages associated with service mega.`
            });
    
            // Gérer les bouquets pour chaque package
            for (const pkg of packages) {
                const packageId = pkg._id;
    
                // Générer le timestamp
                const timestamp = Math.floor(Date.now() / 1000);
    
                // Générer la signature HMAC-SHA256
                const path = `/packages/${pkg.package_id}/bouquets`;
                const secret = process.env.FIRST_PARTY_SECRET;
                const firstPartyId = process.env.FIRST_PARTY_ID;
    
                const signatureMessage = `${path}${timestamp}${firstPartyId}`;
                const signature = crypto
                    .createHmac('sha256', secret)
                    .update(signatureMessage)
                    .digest('hex');
    
                // Faire une requête à l'API en utilisant First Party Authentication
                const response = await axios.get(`${process.env.MEGA_API_URL_DATA}${path}?per_page=${process.env.MEGA_PER_PAGE}&filters[is_children]`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'First-Party-Id': firstPartyId,
                        'First-Party-Signature': signature,
                        'First-Party-Timestamp': timestamp,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
    
                const bouquets = response.data.data;
    
                // Parcourir chaque bouquet et mettre à jour les données dans la base de données
                for (const bouquet of bouquets) {
                    const { id, bouquet_name, type } = bouquet;
    
                    let channel = await Channel.findOne({ packageId: packageId });
    
                    if (!channel) {
                        channel = new Channel({
                            packageId: packageId,
                            LiveBouquet: [],
                            Vod: [],
                            SerieBouquet: []
                        });
                    }
    
                    const result = await Channel.updateOne(
                        {
                            packageId: packageId,
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
    
                    if (result.matchedCount === 0) {
                        const newBouquet = {
                            bouquet_id: id,
                            name: bouquet_name,
                            selected: false,
                            active: true
                        };
    
                        if (type === 'live') {
                            channel.LiveBouquet.push(newBouquet);
                        } else if (type === 'serie') {
                            channel.SerieBouquet.push(newBouquet);
                        } else if (type === 'movie') {
                            channel.Vod.push(newBouquet);
                        }
    
                        await channel.save();
                    }
                }
            }
    
            return res.status(200).json({
                message: "Bouquets updated successfully!",
                results: updateResults,
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour des bouquets :", error);
            return res.status(500).json({ error: 'Error updating bouquets', details: error.message });
        }
    }
};

module.exports = MegaController;