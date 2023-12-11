const acceptLanguage = require('accept-language-parser');
const i18n = require('../config/i18n');

module.exports = (req, res, next) => {
    const preferredLanguages = acceptLanguage.parse(req.headers['accept-language']);

    const selectedLanguage = preferredLanguages.length > 0 ? preferredLanguages[0].code : 'en';

    i18n.setLocale(selectedLanguage);

    next();
};
