const express = require('express');
const router = express.Router();
const path = require('path');

// Route pour servir le fichier de vérification de domaine
router.get('/cryptoapisverifydomain', (req, res) => {
    const filePath = path.join(__dirname, '../verification/cryptoapisverifydomain.txt');
    res.sendFile(filePath);
});

module.exports = router;