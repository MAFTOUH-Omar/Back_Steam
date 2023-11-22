const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/signup', AuthController.SignUp);
router.post('/signin', AuthController.SignIn);

module.exports = router;
