const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const sendCredentialsEmail = require("../mail/cardinality.mail");
const i18n = require('../config/i18n'); 

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|\W).+$/;

const AuthController = {
    SignUp: async (req, res) => {
        try {
            const { FirstName, LastName, Country, phone, email, password } = req.body;
        
            const existingUser = await User.findOne({ email });
        
            if (existingUser) {
                return res.status(400).json({ error: i18n.__('auth.signUp.existingUser') });
            }

            if (
                password.length < 8 ||
                !password.match(passwordRegex)
            ) {
                return res.status(400).json({error : i18n.__('auth.signUp.checkPassword'),});
            }
      
          const encryptedPassword = await bcrypt.hash(password, 10);
      
            const user = await User.create({
                FirstName: FirstName,
                LastName: LastName,
                Country: Country,
                phone: phone,
                email: email.toLowerCase(),
                password: encryptedPassword,
            });
        
            const token = jwt.sign({ user_id: user._id, email }, process.env.KEY, { expiresIn: '3d', });
            user.token = token;
      
            await sendCredentialsEmail({
                FirstName,
                LastName,
                email,
                password,
                token,
            });
      
            res.status(200).json({message : i18n.__('auth.signUp.success') , user,token,});
        } catch (error) {
            console.error(error);
            res.status(500).json({ error : i18n.__('auth.signUp.error') });
        }
    },
    SignIn: async (req, res) => {
        try {
            const { email, password } = req.body;
    
            if (!(email && password)) {
                return res.status(400).send(i18n.__('auth.signIn.required'));
            }
    
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: i18n.__('auth.signIn.notFoundUser') });
            }
    
            if (!user.confirmed) {
                return res.status(401).json({ error: i18n.__('auth.signIn.confirm') });
            }
    
            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign({ id: user._id }, process.env.KEY);
                user.token = token;
                return res.status(200).json({
                    user: {
                        id: user._id,
                        email: user.email,
                        FirstName: user.FirstName,
                        LastName: user.LastName
                    },
                    message: i18n.__('auth.signIn.success'),
                    accessToken: token,
                });
            } else {
                return res.status(401).json({ error: i18n.__('auth.signIn.notFoundUser') });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: i18n.__('auth.signIn.error') });
        }
    },
    ConfirmSingnUp: async (req, res) => {
        const token = req.params.token;
        try {
            const decodedToken = jwt.verify(token, process.env.KEY);
            await User.findByIdAndUpdate(decodedToken.user_id, { confirmed: true });
            res.redirect(process.env.CONFIRMATION_LINK);
        } catch (error) {
            console.error(error);
            res.status(500).send(i18n.__('auth.ConfirmSingnUp.error'));
        }
    },
    Profile: async (req, res) => {
        try {
            const { email, password, newFirstName, newLastName, newPassword, confirmPassword } = req.body;
        
            const user = await User.findOne({ email });
        
            if (!user) {
                return res.status(404).json({ error: i18n.__('auth.Profile.notFound') });
            }
        
            const isPasswordValid = await bcrypt.compare(password, user.password);
        
            if (!isPasswordValid) {
                return res.status(401).json({ error: i18n.__('auth.Profile.inValidPassword') });
            }
        
            if (newFirstName) user.FirstName = newFirstName;
            if (newLastName) user.LastName = newLastName;
        
            if (newPassword) {
                if (newPassword.length < 8 || !newPassword.match(passwordRegex)) {
                    return res.status(400).json({error : i18n.__('auth.Profile.checkNewPassword'),});
                }
        
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ error : i18n.__('auth.Profile.confirmNewPassword') });
                }
        
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
            }
        
            await user.save();
        
            const token = jwt.sign({ id: user._id }, process.env.KEY);
        
            res.status(200).json({
                message: i18n.__('auth.Profile.success'),
                user: {
                id: user._id,
                email: user.email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                },
                token,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: i18n.__('auth.Profile.error') });
        }
    },
};
  
module.exports = AuthController;