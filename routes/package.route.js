const express = require('express');
const router = express.Router();
const Packages = require('../controllers/packages.controler');
const auth = require('../middlewares/auth.middlewares');
const admin = require('../middlewares/admin.middlewares');

router.post('/:serviceId', auth , Packages.AddPackagesToService);
router.get('/packages-by-service/:serviceId', Packages.PackagesByServiceId);
router.get('/count-packages', admin ,Packages.countPackages);

module.exports = router;