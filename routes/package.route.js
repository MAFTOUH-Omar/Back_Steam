const express = require('express');
const router = express.Router();
const Packages = require('../controllers/packages.controler');
const auth = require('../middlewares/auth.middlewares');

router.post('/:serviceId', auth , Packages.AddPackagesToService);

module.exports = router;