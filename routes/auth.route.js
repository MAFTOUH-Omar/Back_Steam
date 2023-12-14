const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middlewares');
const i18n = require('../config/i18n'); 

const validateSignUpInput = (req, res, next) => {
    const { FirstName, LastName, Country, phone, email, password } = req.body;

    if (!(email && password && Country && phone && LastName && FirstName)) {
        return res.status(400).send(i18n.__('authRoute.allInputRequired'));
    }

    next();
};

router.post('/signup', validateSignUpInput , AuthController.SignUp);
router.post('/signin', AuthController.SignIn);
router.get('/confirm-signup/:token', AuthController.ConfirmSingnUp);
router.put('/profile', auth , AuthController.Profile);

module.exports = router;
