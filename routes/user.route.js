const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middlewares');

router.get('/count-user', auth , UserController.countUser);
router.get('/all-user', auth , UserController.getAllUsers);

module.exports = router;