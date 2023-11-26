const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middlewares');

const validateSignUpInput = (req, res, next) => {
    const { FirstName, LastName, Country, phone, email, password } = req.body;

    if (!(email && password && Country && LastName && phone && LastName && FirstName)) {
        return res.status(400).send("All input is required");
    }

    next();
};

router.post('/signup', validateSignUpInput , AuthController.SignUp);
router.post('/signin', AuthController.SignIn);
router.get('/confirm-signup/:token', AuthController.ConfirmSingnUp);
router.put('/profile', auth , AuthController.Profile);

module.exports = router;
