const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    Mybg: {
        type: String,
        default: '#84cc16'
    },
    MybgHover: {
        type: String,
        default: '#a3e635'
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

const Theme = mongoose.model('Theme', themeSchema);
module.exports = Theme;