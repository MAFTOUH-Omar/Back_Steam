const express = require('express');
const router = express.Router();
const Packages = require('../controllers/packages.controler');
const admin = require('../middlewares/admin.middlewares');

router.get('/packages-by-service/:serviceId', Packages.PackagesByServiceId);
router.get('/:serviceId', Packages.getAvailablePackagesForService);
router.get('/count-packages', admin ,Packages.countPackages);
router.get('/:serviceId', admin ,Packages.getPackageById);
router.put('/enable/:serviceId', admin ,Packages.enablePackage);
router.put('/disable/:serviceId', admin ,Packages.disablePackage);  

module.exports = router;