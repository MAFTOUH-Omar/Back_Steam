const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const sendCredentialsEmail = require("../mail/cardinality.mail");

const AuthController = {
    SignUp: async (req, res) => {
      try {
        const { FirstName, LastName, Country, phone, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
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

        const token = jwt.sign({ user_id: user._id, email }, process.env.KEY,{ expiresIn: "3d" });
        user.token = token; 
        
        // await sendCredentialsEmail({ FirstName , LastName , email , password , token});
  
        res.status(200).json({ message: 'Inscription réussie. Veuillez vérifier votre e-mail pour confirmer.'  , user , token});
      } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erreur lors de l\'inscription' });
        }
    },
  
    SignIn: async (req, res) => {
        try {
            const { email, password } = req.body;
    
            if (!(email && password)) {
                return res.status(400).send("All input is required");
            }
    
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect' });
            }
    
            if (!user.confirmed) {
                return res.status(401).json({ error: 'Veuillez confirmer votre adresse e-mail pour vous connecter.' });
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
                    message: "Login successfull",
                    accessToken: token,
                });
            } else {
                return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erreur lors de la connexion' });
        }
    },
    ConfirmSingnUp: async (req, res) => {
        const token = req.params.token;
        try {
            const decodedToken = jwt.verify(token, process.env.KEY);
            await User.findByIdAndUpdate(decodedToken.user_id, { confirmed: true });
            res.status(200).send('Registration confirmed successfully. You can now sign in.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error confirming registration.');
        }
    }
};
  
module.exports = AuthController;