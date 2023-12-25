const express = require('express');
const router = express.Router();
const SuperAdminController = require('../controllers/superAdmin.controller');

router.post('/signin', SuperAdminController.signIn);
router.post('/addSuperAdmin', SuperAdminController.addSuperAdmin);

//Verification du code & email & return token
router.get('/verify-code', async (req, res) => {
    const { email, code } = req.query;
  
    try {
        const result = await SuperAdminController.verifyCode(email, code);
    
        if (result.status === 200) {
            return res.status(200).json({ message: result.message, token: result.token });
        } else {
            return res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Une erreur s\'est produite lors de la vérification du code.' });
    }
});

module.exports = router;