const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const admin = require('../middlewares/admin.middlewares');

router.get('/count-user', admin , UserController.countUser);
router.get('/all-user', admin , UserController.getAllUsers);

module.exports = router;