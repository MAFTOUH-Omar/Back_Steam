const express = require('express');
const router = express.Router();
const Service = require('../controllers/service.controller');
const admin = require('../middlewares/admin.middlewares');
const multer = require("multer");
const path = require("path");
const superAdmin = require('../middlewares/superAdmin.middleware')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Picture/service_picture/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + ext);
    },
});

const upload = multer({ storage });

router.get('/all', Service.All);
router.post('/addImage/:_id', upload.single('filename'), superAdmin , Service.addServiceImage);
router.get('/getEnableSerive', Service.getEnableSerive);
router.get('/count-service', admin , Service.countServices);
router.get('/:serviceId', admin , Service.getServiceById);
router.get('/', admin , Service.getAllServicesWithCredit);
router.put('/enable/:_id', admin , Service.enableService);
router.put('/disable/:_id', admin , Service.disableService);
router.put('/update-service-description/:_id', admin , Service.updateServiceDescription);

module.exports = router;