const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const SignUpController = require('../controllers/signup.controller');

const validateSignUpInput = (req, res, next) => {
    const { FirstName, LastName, Country, phone, email, password } = req.body;

    if (!(email && password && Country && LastName && phone && LastName && FirstName)) {
        return res.status(400).send("All input is required");
    }

    next();
};

router.post('/signup', validateSignUpInput , SignUpController.subscribe);
router.post('/signin', AuthController.SignIn);
router.get('/confirm-signup/:token', AuthController.ConfirmSingnUp);

module.exports = router;
