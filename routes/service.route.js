const express = require('express');
const router = express.Router();
const Service = require('../controllers/service.controller');
const admin = require('../middlewares/admin.middlewares');

router.get('/all', Service.All);
router.get('/count-service', admin , Service.countServices);
router.get('/:serviceId', admin , Service.getServiceById);
router.get('/', admin , Service.getAllServicesWithCredit);

module.exports = router;