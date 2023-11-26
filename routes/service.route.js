const express = require('express');
const router = express.Router();
const Service = require('../controllers/service.controller');
const auth = require('../middlewares/auth.middlewares');

router.get('/all', Service.All);
router.get('/service-count', auth , Service.countServices);

module.exports = router;