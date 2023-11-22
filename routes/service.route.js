const express = require('express');
const router = express.Router();
const Service = require('../controllers/service.controller');

router.get('/all', Service.All);

module.exports = router;
