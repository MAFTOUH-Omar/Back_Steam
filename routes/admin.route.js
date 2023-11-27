const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
// const admin = require('../middlewares/admin.middlewares');

router.post('/signin' , AdminController.adminSignin);
router.post('/add' , AdminController.addAdmin);

module.exports = router;