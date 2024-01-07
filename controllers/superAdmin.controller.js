const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const SuperAdmin = require('../models/superAdmin.model');
const i18n = require('../config/i18n');
const generateVerificationCode = require('../helpers/generateVerificationCode');
const sendCredentialsEmail = require("../mail/superAdmin.mail");
const Admin = require('../models/admin.model');
const Service =  require('../models/service.model')


const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
  
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d|[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
};

const SuperAdminController = {
    signIn: async (req, res) => {
        const { email, password } = req.body;

        try {
            const superAdmin = await SuperAdmin.findOne({ email });
            if (!superAdmin) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            const code = generateVerificationCode();
            superAdmin.code = code;
            superAdmin.expirationTime = new Date(Date.now() + 5 * 60 * 1000);
            await superAdmin.save();

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
    addSuperAdmin: async (req, res) => {
        const { SuperadminName, password, email } = req.body;
    
        try {
            const existingAdmin = await SuperAdmin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Un super admin avec cette adresse e-mail existe déjà.' });
            }
        
            const hashedPassword = await bcrypt.hash(password, 10);
        
            const code = generateVerificationCode();
        
            const newSuperAdmin = new SuperAdmin({
                SuperadminName,
                password: hashedPassword,
                email,
                code,
                expirationTime: new Date(Date.now() + 5 * 60 * 1000),
            });
        
            await newSuperAdmin.save();
        
            return res.status(201).json({ message: 'Super admin ajouté avec succès.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de l\'ajout du super admin.' });
        }
    },
    verifyCode: async (email, code) => {
        try {
            const superAdmin = await SuperAdmin.findOne({ email });
    
            if (!superAdmin) {
                return { status: 404, message: 'Super admin introuvable.' };
            }

            if (superAdmin.code === parseInt(code) && superAdmin.expirationTime > new Date()) {
                superAdmin.code = null;
                superAdmin.expirationTime = null;
                await superAdmin.save();
    
                const token = jwt.sign({ _id: superAdmin._id }, process.env.KEY)
    
                return { status: 200, message: 'Code de validation valide.', token };
            } else {
                return { status: 400, message: 'Code de validation invalide ou expiré.' };
            }
        } catch (error) {
            console.error(error);
            return { status: 500, message: 'Une erreur s\'est produite lors de la vérification du code.' };
        }
    },
    addAdmin: async (req, res) => {
        try {
            const { adminName, email, password } = req.body;
        
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Adresse e-mail invalide.' });
            }
        
            if (!validatePassword(password)) {
                return res.status(400).json({
                    error: 'Le mot de passe doit contenir au moins 8 caractères et inclure au moins un chiffre ou un caractère spécial.',
                });
            }
        
            const existingAdmin = await Admin.findOne({ email });
        
            if (existingAdmin) {
                return res.status(400).json({ error: 'Un admin avec cette adresse e-mail existe déjà.' });
            }
        
            const saltRounds = 8;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
        
            const newAdmin = new Admin({
                adminName,
                email,
                password: hashedPassword,
            });
        
            await newAdmin.save();
        
            res.status(201).json({ admin: newAdmin });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la vérification du code.' });
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
};

module.exports = SuperAdminController;