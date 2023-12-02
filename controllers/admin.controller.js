const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin.model');
const Service = require('../models/service.model');
const qrcode = require('qrcode');

const AdminController = {
    generateQRCode: async (data) => {
        try {
            // Générer un code à 8 chiffres
            const code = Math.floor(10000000 + Math.random() * 90000000);
    
            // Temps d'expiration d'une minute
            const expirationTime = new Date();
            expirationTime.setMinutes(expirationTime.getMinutes() + 5);
    
            // Créer un objet avec le code et le temps d'expiration
            const qrCodeData = {
                code,
            };
            const qrExprationTime = {
                expirationTime
            };
    
            // Convertir l'objet en chaîne JSON
            const qrCodeJSON = JSON.stringify(qrCodeData);
    
            // Générer le code QR avec la représentation base64
            const qrCodeURL = await qrcode.toDataURL(qrCodeJSON);
    
            return { qrCodeURL, qrCodeData , qrExprationTime};
        } catch (error) {
            throw new Error('Erreur lors de la génération du code QR');
        }
    },    
    adminSignin: async (req, res) => {
        try {
            const admin = await Admin.findByCredentials(req.body.email, req.body.password);
    
            // Vérifier si l'administrateur existe
            if (!admin) {
                return res.status(401).send({ error: 'Identifiants invalides' });
            }
    
            // Générer le code QR
            const { qrCodeURL, qrCodeData, qrExprationTime } = await AdminController.generateQRCode(admin._id.toString());
    
            // Stocker le code QR et ses données dans la base de données
            admin.QRCode = qrCodeData.code;
            admin.expirationTime = qrExprationTime.expirationTime;
            await admin.save();
    
            res.status(200).send({ _id: admin._id, qrCodeURL });
        } catch (error) {
            res.status(500).send({ error: 'Une erreur est survenue lors de la connexion.'});
        }
    },          
    checkQRCode: async (req, res) => {
        try {
            const { adminId, code } = req.body;
            const admin = await Admin.findById(adminId);

            if (!admin) {
                return res.status(404).send({ error: 'Admin non trouvé' });
            }

            // Vérifier si le code fourni correspond au code généré par generateQRCode
            if (admin.QRCode !== code) {
                return res.status(401).send({ error: 'Code QR invalide' });
            }

            // Vérifier si le code a expiré
            const now = new Date();

            if (now > admin.expirationTime) {
                return res.status(401).send({ error: 'Le code QR a expiré' });
            }

            // Vous pouvez ajouter d'autres validations ici si nécessaire
            
            const token = jwt.sign({ _id: admin._id.toString() }, process.env.KEY);

            res.status(200).send({ admin, token });
        } catch (error) {
            res.status(500).json({ error: 'Erreur lors de la vérification du code QR.' });
        }
    },
    addAdmin: async (req, res) => {
        try {
            const { adminName, email, password } = req.body;

            const existingAdmin = await Admin.findOne({ email });

            if (existingAdmin) {
                return res.status(400).json({ error: 'Un administrateur avec cet email existe déjà.' });
            }

            const saltRounds = 8;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newAdmin = new Admin({
                adminName,
                email,
                password: hashedPassword,
            });

            await newAdmin.save();

            const firstTwoServices = await Service.find().sort({ created: 1 }).limit(2);
            const firstTwoServiceIds = firstTwoServices.map(service => service._id);

            newAdmin.services = firstTwoServiceIds;
            await newAdmin.save();

            const token = jwt.sign({ _id: newAdmin._id }, process.env.KEY, { expiresIn: '1h' });

            res.status(201).json({ admin: newAdmin, token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'administrateur.' });
        }
    },
};

module.exports = AdminController;