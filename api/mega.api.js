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
                client_id: 1,
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
    
            const timestamp = Math.floor(Date.now() / 1000);
            const path = '/packages';
            const secret = process.env.FIRST_PARTY_SECRET;
            const firstPartyId = process.env.FIRST_PARTY_ID;
            const signatureMessage = `${path}${timestamp}${firstPartyId}`;
            const signature = crypto
                .createHmac('sha256', secret)
                .update(signatureMessage)
                .digest('hex');
    
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
    
            const megaService = await Service.findOne({ name: { $regex: /^mega$/i } });
            if (!megaService) {
                return res.status(404).json({ error: 'Service mega not found' });
            }
    
            const existingPackages = await Package.find({ serviceId: megaService._id });
            const existingPackageIds = existingPackages.map(pkg => pkg.package_id);
    
            const apiPackageIds = packages.map(pkg => pkg.id);
    
            const packagesToDelete = existingPackages.filter(pkg => !apiPackageIds.includes(pkg.package_id));
            const deleteResult = await Package.deleteMany({
                package_id: { $in: packagesToDelete.map(pkg => pkg.package_id) },
                serviceId: megaService._id
            });
    
            updateResults.push({
                deletedCount: deleteResult.deletedCount,
                message: `Ancien(s) package(s) supprimé(s) car non présent(s) dans l'API.`
            });
    
            for (let pkg of packages) {
                const { id: package_id, name, period, period_type } = pkg;
    
                let duration = period;
                if (period_type === 'month') {
                    duration = period * 30;
                } else if (period_type === 'year') {
                    duration = period * 365;
                }
    
                let existingPackage = await Package.findOne({ package_id, serviceId: megaService._id });
    
                if (existingPackage) {
                    existingPackage.name = name;
                    existingPackage.duration = duration;
                    await existingPackage.save();
                    updateResults.push({
                        package_id: existingPackage.package_id,
                        status: 'updated',
                        name: existingPackage.name
                    });
                } else {
                    const newPackage = new Package({
                        package_id,
                        name,
                        price: 0,
                        currency: 'USD',
                        duration,
                        etat: 'Not Available',
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
                message: 'Packages traités avec succès',
                results: updateResults
            });
    
        } catch (error) {
            return res.status(500).json({
                error: 'Erreur lors de la mise à jour des packages',
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
    },
    M3uCreate: async (
        username,
        password,
        package_id,
        customer_has_paid = 1,
        enable_vpn = 0,
        max_connections = 1,
        country = 'all',
        note = 'This subscription created through the store',
        whatsapp_telegram = '098765432',
        bouquets = [],
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            customer_has_paid = parseInt(customer_has_paid, 10);
            enable_vpn = parseInt(enable_vpn, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
    
            const sanitizedBouquets = Array.isArray(bouquets) 
                ? bouquets.map(id => parseInt(id, 10)).filter(Number.isInteger) 
                : [];
    
            const data = {
                username : username,
                password : password,
                package_id : package_id,
                customer_has_paid : customer_has_paid,
                enable_vpn : enable_vpn,
                max_connections : max_connections,
                country : country,
                note : note,
                whatsapp_telegram : whatsapp_telegram,
                bouquets : sanitizedBouquets,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/m3us`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'M3U subscription created successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error creating M3U subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },
    MagCreate: async (
        mac_address,
        package_id,
        customer_has_paid = 1,
        enable_vpn = 0,
        max_connections = 1,
        country = 'all',
        note = 'This subscription created through the store',
        whatsapp_telegram = '098765432',
        bouquets = [],
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            customer_has_paid = parseInt(customer_has_paid, 10);
            enable_vpn = parseInt(enable_vpn, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
    
            const sanitizedBouquets = Array.isArray(bouquets) 
                ? bouquets.map(id => parseInt(id, 10)).filter(Number.isInteger) 
                : [];
    
            const data = {
                mac_address : mac_address,
                package_id : package_id,
                customer_has_paid : customer_has_paid,
                enable_vpn : enable_vpn,
                max_connections : max_connections,
                country : country,
                note : note,
                whatsapp_telegram : whatsapp_telegram,
                bouquets : sanitizedBouquets,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/mags`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'Mag subscription created successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error creating Mag subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },    
    ActivecodeCreate: async (
        activecode_device_id = 1,
        package_id,
        customer_has_paid = 1,
        enable_vpn = 0,
        max_connections = 1,
        country = 'all',
        note = 'This subscription created through the store',
        whatsapp_telegram = '098765432',
        bouquets = [],
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            customer_has_paid = parseInt(customer_has_paid, 10);
            enable_vpn = parseInt(enable_vpn, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
            activecode_device_id = parseInt(activecode_device_id, 10);
    
            const sanitizedBouquets = Array.isArray(bouquets) 
                ? bouquets.map(id => parseInt(id, 10)).filter(Number.isInteger) 
                : [];
    
            const data = {
                activecode_device_id : activecode_device_id,
                package_id : package_id,
                customer_has_paid : customer_has_paid,
                enable_vpn : enable_vpn,
                max_connections : max_connections,
                country : country,
                note : note,
                whatsapp_telegram : whatsapp_telegram,
                bouquets : sanitizedBouquets,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/activecodes`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'Activecode subscription created successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error creating Activecode subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },
    M3uExtend: async (
        subscription_id = 95 ,
        package_id,
        max_connections = 1,
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
            subscription_id = parseInt(subscription_id, 10);
    
            const data = {
                package_id : package_id,
                max_connections : max_connections,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/m3us/${subscription_id}/extend`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'M3U subscription extended successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error extend M3U subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },
    MagExtend: async (
        subscription_id = 10 ,
        package_id,
        max_connections = 1,
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
            subscription_id = parseInt(subscription_id, 10);
    
            const data = {
                package_id : package_id,
                max_connections : max_connections,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/mags/${subscription_id}/extend`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'Mag subscription extended successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error extend Mag subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },
    ActivecodeExtend: async (
        subscription_id = 10 ,
        package_id,
        max_connections = 1,
        user_id = process.env.MEGA_CLIENT_ID
    ) => {
        try {
            const token = await MegaController.Authentification();
            if (token.error) {
                return {
                    error: 'Authentication failed',
                    details: token.details
                };
            }
    
            package_id = parseInt(package_id, 10);
            max_connections = parseInt(max_connections, 10);
            user_id = parseInt(user_id, 10);
            subscription_id = parseInt(subscription_id, 10);
    
            const data = {
                package_id : package_id,
                max_connections : max_connections,
                user_id : user_id
            };

            const response = await axios.post(
                `${process.env.MEGA_API_URL_DATA}/activecodes/${subscription_id}/extend`,
                data,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
    
            return {
                message: 'Activecode subscription extended successfully',
                data: response.data
            };
        } catch (error) {
            return {
                error: 'Error extend Activecode subscription',
                details: error.response ? error.response.data : error.message
            };
        }
    },
};

module.exports = MegaController;