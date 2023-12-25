const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const SuperAdmin = require('../models/superAdmin.model');
const i18n = require('../config/i18n');
const generateVerificationCode = require('../helpers/generateVerificationCode');
const sendCredentialsEmail = require("../mail/superAdmin.mail");
const Admin = require('../models/admin.model');

const SuperAdminController = {
    signIn: async (req, res) => {
        const { email, password } = req.body;

        try {
            // Vérifier si l'utilisateur existe
            const superAdmin = await SuperAdmin.findOne({ email });
            if (!superAdmin) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
            }

            // Générer et sauvegarder le code de vérification avec expiration de 5 minutes
            const code = generateVerificationCode();
            superAdmin.code = code;
            superAdmin.expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes d'expiration
            await superAdmin.save();

            await sendCredentialsEmail({
                email , 
                code
            })
            
            return res.status(200).json({ code, message: 'Code généré avec succès.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la connexion.' });
        }
    },
    addSuperAdmin: async (req, res) => {
        const { SuperadminName, password, email } = req.body;
    
        try {
            // Vérifier si l'utilisateur existe déjà
            const existingAdmin = await SuperAdmin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Un super admin avec cette adresse e-mail existe déjà.' });
            }
        
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
        
            // Générer et sauvegarder le code de vérification avec expiration de 5 minutes
            const code = generateVerificationCode();
        
            const newSuperAdmin = new SuperAdmin({
                SuperadminName,
                password: hashedPassword,
                email,
                code,
                expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes d'expiration
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
        
            // Vérifier si le super admin existe
            if (!superAdmin) {
                return { status: 404, message: 'Super admin introuvable.' };
            }
        
            // Vérifier si le code est valide
            if (superAdmin.code === parseInt(code) && superAdmin.expirationTime > new Date()) {
                // Le code est valide et n'a pas expiré
        
                // Mettre à jour le super admin pour indiquer que le code a été utilisé
                superAdmin.code = null;
                superAdmin.expirationTime = null;
                await superAdmin.save();
        
                // Créer un token
                const token = jwt.sign({ _id: superAdmin._id }, process.env.KEY);
        
                return { status: 200, message: 'Code de validation valide.', token };
            } else {
                // Le code est invalide ou a expiré
                return { status: 400, message: 'Code de validation invalide ou expiré.' };
            }   
        } catch (error) {
            console.error(error);
            return { status: 500, message: 'Une erreur s\'est produite lors de la vérification du code.' };
        }
    },
};

module.exports = SuperAdminController;