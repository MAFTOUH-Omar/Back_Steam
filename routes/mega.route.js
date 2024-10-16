const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const MegaController = require('../api/mega.api');

router.use(bodyParser.json());
router.get('/service', MegaController.Service);
router.get('/packages', MegaController.Packages);
router.get('/bouquets', MegaController.Bouquets);

module.exports = router;