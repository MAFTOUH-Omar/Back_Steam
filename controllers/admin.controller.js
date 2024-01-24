const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin.model');
const i18n = require('../config/i18n'); 
const generateVerificationCode = require('../helpers/generateVerificationCode');
const sendCredentialsEmail = require("../mail/admin.mail");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|\W).+$/;

const AdminController = {
    signIn: async (req, res) => {
        const { email, password } = req.body;

        try {
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            const code = generateVerificationCode();
            admin.code = code;
            admin.expirationTime = new Date(Date.now() + 5 * 60 * 1000);
            admin.lastConnect = new Date();
            await admin.save();

            await sendCredentialsEmail({
                email , 
                code
            })
            
            return res.status(200).json({ message: 'Connexion réussie , Veuillez vérifier votre e-mail pour confirmer'});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la connexion.' });
        }
    },
    verifyCode: async (email, code) => {
        try {
            const admin = await Admin.findOne({ email });
    
            if (!admin) {
                return { status: 404, message: 'admin introuvable.' };
            }

            if (admin.code === parseInt(code) && admin.expirationTime > new Date()) {
                admin.code = null;
                admin.expirationTime = null;
                await admin.save();
    
                const token = jwt.sign({ _id: admin._id }, process.env.KEY)
    
                return { status: 200, message: 'Code de validation valide.', token };
            } else {
                return { status: 400, message: 'Code de validation invalide ou expiré.' };
            }
        } catch (error) {
            console.error(error);
            return { status: 500, message: 'Une erreur s\'est produite lors de la vérification du code.' };
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
    getAllAdmins: async (req, res) => {
        try {
            const admins = await Admin.find({}, 'adminName email lastConnect');

            res.status(200).json(admins);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while fetching admins.' });
        }
    },
    deleteAdmin: async (req, res) => {
        try {
            const { adminId } = req.params;

            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found.' });
            }

            await Admin.findByIdAndDelete(adminId);

            res.status(200).json({ message: 'Admin deleted successfully.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while deleting the admin.' });
        }
    },
    updateAdminById: async (req, res) => {
        try {
            const adminId = req.params.id;
            const { adminName, email, password } = req.body;

            if (!adminName || !email || !password) {
                return res.status(400).json({ error : "all champ are required" })
            }
    
            // Validation de l'email
            if (!email || !email.trim()) {
                return res.status(400).json({ error: 'Email is required' });
            }
    
            // Validation du mot de passe
            if (password && !passwordRegex.test(password)) {
                return res.status(400).json({ error: 'Invalid password format' });
            }
    
            // Hash du mot de passe avec bcrypt si fourni
            let hashedPassword;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
    
            // Mettre à jour les champs spécifiés
            const updates = {};
            if (adminName) updates.adminName = adminName;
            if (email) updates.email = email;
            if (password) updates.password = hashedPassword;
    
            // Mettre à jour le document dans la base de données
            const updatedAdmin = await Admin.findByIdAndUpdate(
                adminId,
                { $set: updates },
                { new: true }
            );
    
            if (!updatedAdmin) {
                return res.status(404).json({ error: 'Admin not found' });
            }
    
            res.json(updatedAdmin);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
};

module.exports = AdminController;