const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const MegaController = require('../api/mega.api');
const admin = require('../middlewares/admin.middlewares');

router.use(bodyParser.json());
router.get('/service', admin ,MegaController.Service);
router.get('/packages', admin ,MegaController.Packages);
router.get('/bouquets', admin ,MegaController.Bouquets);

module.exports = router;