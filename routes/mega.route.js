const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const MegaController = require('../api/mega.api');

router.use(bodyParser.json());
router.post('/authentification' , MegaController.Authentification);
router.get('/packages', MegaController.Packages);
router.get('/bouquets', MegaController.Bouquets);

module.exports = router;