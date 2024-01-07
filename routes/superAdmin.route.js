const express = require('express');
const router = express.Router();
const SuperAdminController = require('../controllers/superAdmin.controller');
const superAdmin = require('../middlewares/superAdmin.middleware')

router.post('/signin', SuperAdminController.signIn);
router.post('/addSuperAdmin', SuperAdminController.addSuperAdmin);
router.post('/addAdmin' , superAdmin , SuperAdminController.addAdmin);
router.put('/enable/:_id', superAdmin , SuperAdminController.enableService);
router.put('/disable/:_id', superAdmin , SuperAdminController.disableService);
router.post('/verify-code/', async (req, res) => {
    const { email, code } = req.query;

    try {
        const verificationResult = await SuperAdminController.verifyCode(email, code);

        return res.status(verificationResult.status).json({
            message: verificationResult.message,
            token: verificationResult.token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;