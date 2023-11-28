const express = require('express');
const router = express.Router();
const Theme = require('../controllers/theme.controller');
const admin = require('../middlewares/admin.middlewares');

router.put('/edit-theme', admin , Theme.updateTheme);
router.get('/show', Theme.getTheme);

module.exports = router;