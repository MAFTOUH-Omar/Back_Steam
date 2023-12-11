const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin.model');
const Service = require('../models/service.model');
const qrcode = require('qrcode');
const i18n = require('../config/i18n'); 

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
            throw new Error(i18n.__('admin.generateQRCode.error'));
        }
    },    
    adminSignin: async (req, res) => {
        try {
            const admin = await Admin.findByCredentials(req.body.email, req.body.password);
    
            if (!admin) {
                return res.status(401).send({ error: i18n.__('admin.adminSignin.InvalidCredential') });
            }
    
            const { qrCodeURL, qrCodeData, qrExprationTime } = await AdminController.generateQRCode(admin._id.toString());
    
            admin.QRCode = qrCodeData.code;
            admin.expirationTime = qrExprationTime.expirationTime;
            await admin.save();
    
            res.status(200).send({ _id: admin._id, qrCodeURL });
        } catch (error) {
            res.status(500).send({ error : i18n.__('admin.adminSignin.error')});
        }
    },          
    checkQRCode: async (req, res) => {
        try {
            const { adminId, code } = req.body;
            const admin = await Admin.findById(adminId);

            if (!admin) {
                return res.status(404).send({ error: i18n.__('admin.checkQRCode.notFound') });
            }

            if (admin.QRCode !== code) {
                return res.status(401).send({ error: i18n.__('admin.checkQRCode.invalidQrCode') });
            }

            const now = new Date();

            if (now > admin.expirationTime) {
                return res.status(401).send({ error: i18n.__('admin.checkQRCode.expireQrCode') });
            }
            
            const token = jwt.sign({ _id: admin._id.toString() }, process.env.KEY);

            res.status(200).send({ admin, token });
        } catch (error) {
            res.status(500).json({ error: i18n.__('admin.checkQRCode.error') });
        }
    },
    addAdmin: async (req, res) => {
        try {
            const { adminName, email, password } = req.body;

            const existingAdmin = await Admin.findOne({ email });

            if (existingAdmin) {
                return res.status(400).json({ error: i18n.__('admin.addAdmin.addAdmin') });
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
            res.status(500).json({ error: i18n.__('admin.addAdmin.error') });
        }
    },
    updateAdminProfile: async (req, res) => {
        try {
            const { adminId } = req.params;
            const { email, currentPassword, newPassword, confirmPassword, adminName } = req.body;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email)) {
                return res.status(400).json({ error: i18n.__('admin.updateAdminProfile.checkEmail') });
            }

            // Check if current password is provided
            if (!currentPassword) {
                return res.status(400).json({ error: i18n.__('admin.updateAdminProfile.requiredCurrentPassword') });
            }

            // Validate password strength
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (newPassword && !passwordRegex.test(newPassword)) {
                return res.status(400).json({ error: i18n.__('admin.updateAdminProfile.checkNewPassword') });
            }

            // Retrieve admin from the database
            const admin = await Admin.findById(adminId);

            // Check if the current password matches the stored password
            const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: i18n.__('admin.updateAdminProfile.invalidPassword') });
            }

            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: i18n.__('admin.updateAdminProfile.invalidConfirmPassword') });
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

            res.status(200).json({ message: i18n.__('admin.updateAdminProfile.success') , admin: updatedAdmin });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('admin.updateAdminProfile.error') });
        }
    },
};

module.exports = AdminController;