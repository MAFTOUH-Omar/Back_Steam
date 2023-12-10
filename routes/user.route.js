const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const admin = require('../middlewares/admin.middlewares');

router.get('/count-user', admin , UserController.countUser);
router.get('/all-user', admin , UserController.getAllUsers);
router.get('/:id', admin , UserController.getUserById);
router.delete('/:id', admin , UserController.deleteUser);

module.exports = router;