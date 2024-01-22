const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const admin = require('../middlewares/admin.middlewares');

router.get('/count-user', admin , UserController.countUser);
router.get('/all-user', admin , UserController.getAllUsers);
router.get('/:id', admin , UserController.getUserById);
router.put('/banned/:id', admin , UserController.BanneUser);
router.put('/authorize/:id', admin , UserController.AuthorizeUser);
router.put('/update-user/:id', admin , UserController.updateUserById);

module.exports = router;