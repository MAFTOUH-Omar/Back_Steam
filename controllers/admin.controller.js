const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin.model');
const Service = require('../models/service.model');
const qrcode = require('qrcode');

const AdminController = {
    generateQRCode: async (data) => {
        try {
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

            if (admin.QRCode !== code) {
                return res.status(401).send({ error: 'Code QR invalide' });
            }

            const now = new Date();

            if (now > admin.expirationTime) {
                return res.status(401).send({ error: 'Le code QR a expiré' });
            }
            
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
    updateAdminProfile: async (req, res) => {
        try {
            const { adminId } = req.params;
            const { email, currentPassword, newPassword, confirmPassword, adminName } = req.body;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email format is invalid' });
            }

            // Check if current password is provided
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required' });
            }

            // Validate password strength
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (newPassword && !passwordRegex.test(newPassword)) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character' });
            }

            // Retrieve admin from the database
            const admin = await Admin.findById(adminId);

            // Check if the current password matches the stored password
            const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: 'New password and confirm password do not match' });
            }

            // Update admin profile
            const updateFields = {};
            if (email) updateFields.email = email;
            if (newPassword) {
                const saltRounds = 8;
                updateFields.password = await bcrypt.hash(newPassword, saltRounds);
            }
            if (adminName) updateFields.adminName = adminName;

            const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateFields, { new: true });

            res.status(200).json({ message: 'Profil mis à jour avec succès', admin: updatedAdmin });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error updating admin profile' });
        }
    },
};

module.exports = AdminController;