const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin.model');
const Service = require('../models/service.model')

const AdminController = {
    adminSignin: async (req, res) => {
        try {
            const admin = await Admin.findByCredentials(req.body.email, req.body.password);

            if (admin.dernierToken && admin.dernierToken !== req.body.dernierToken) {
                return res.status(401).send({ error: 'Le dernier token est incorrect' });
            }

            const token = jwt.sign({ _id: admin._id.toString() }, process.env.KEY);

            admin.dernierToken = token;
            admin.tokens = admin.tokens.concat({ token });
            await admin.save();

            res.status(200).send({ admin, token });
        } catch (error) {
            res.status(401).send({ error: 'Identifiants invalides' });
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
    
            newAdmin.tokens = newAdmin.tokens.concat({ token });
            await newAdmin.save();
    
            res.status(201).json({ admin: newAdmin, token });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'administrateur.' });
        }
    },
};

module.exports = AdminController;