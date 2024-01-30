const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const admin = require('../middlewares/admin.middlewares');
const superAdmin = require('../middlewares/superAdmin.middleware')

router.post('/signin', AdminController.signIn);
router.post('/verify-code/', async (req, res) => {
    const { email, code } = req.query;

    try {
        const verificationResult = await AdminController.verifyCode(email, code);

        return res.status(verificationResult.status).json({
            message: verificationResult.message,
            token: verificationResult.token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.put('/profile/:adminId', admin , AdminController.updateAdminProfile);
router.get('/allAdmins' , superAdmin , AdminController.getAllAdmins)
router.delete('/delete/:adminId' , superAdmin , AdminController.deleteAdmin)
router.put('/update-admin/:id' , superAdmin , AdminController.updateAdminById)
router.post('/password-reset/:id', superAdmin , AdminController.passwordReset);

module.exports = router;