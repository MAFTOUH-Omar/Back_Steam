const express = require('express');
const router = express.Router();
const Packages = require('../controllers/packages.controler');
const admin = require('../middlewares/admin.middlewares');

router.get('/packages-by-service/:serviceId', Packages.PackagesByServiceId);
router.get('/count-packages', admin ,Packages.countPackages);
router.get('/:id', admin ,Packages.getPackageById);
router.post('/add', admin ,Packages.AddPackagesToService);
router.delete('/:id', admin ,Packages.DeletePackage);
router.put('/:id', admin , Packages.EditPackage);

module.exports = router;