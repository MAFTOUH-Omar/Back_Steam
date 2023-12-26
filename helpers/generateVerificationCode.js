const crypto = require('crypto');
const cron = require('node-cron');

const verificationCodes = {};

function generateVerificationCode() {
    const code = Math.floor(10000 + Math.random() * 90000);
    
    // Vérifier si le code est déjà utilisé
    if (verificationCodes[code]) {
        // Si le code est déjà utilisé, générer un nouveau code récursivement
        return generateVerificationCode();
    }

    // Enregistre le code dans l'objet et planifie sa suppression après 5 minutes
    verificationCodes[code] = true;
    cron.schedule('*/5 * * * *', () => {
        delete verificationCodes[code];
    });

    return code;
}

module.exports = generateVerificationCode;