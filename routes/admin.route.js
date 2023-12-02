const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
// const admin = require('../middlewares/admin.middlewares');

router.post('/signin', AdminController.adminSignin);
router.post('/checkQRCode' ,AdminController.checkQRCode);
router.post('/addAdmin', AdminController.addAdmin);

module.exports = router;