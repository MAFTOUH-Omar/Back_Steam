const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middlewares');
const i18n = require('../config/i18n');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Les endpoints liés à l'authentification des utilisateurs
*/

const validateSignUpInput = (req, res, next) => {
    const { FirstName, LastName, Country, phone, email, password } = req.body;

    if (!(email && password && Country && phone && LastName && FirstName)) {
        return res.status(400).send(i18n.__('authRoute.allInputRequired'));
    }

    next();
};

/**
* @swagger
* /auth/signup:
*   post:
*     summary: Inscription utilisateur
*     description: Crée un nouveau compte utilisateur.
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               FirstName:
*                 type: string
*               LastName:
*                 type: string
*               Country:
*                 type: string
*               phone:
*                 type: string
*               email:
*                 type: string
*               password:
*                 type: string
*     responses:
*       200:
*         description: Utilisateur inscrit avec succès
*       400:
*         description: Paramètres d'entrée non valides
*/

router.post('/signup', validateSignUpInput , AuthController.SignUp);
router.post('/signin', AuthController.SignIn);
router.get('/confirm-signup/:token', AuthController.ConfirmSingnUp);
router.put('/profile', auth , AuthController.Profile);

module.exports = router;
