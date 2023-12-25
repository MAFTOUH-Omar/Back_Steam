const mongoose = require('mongoose');

const SuperAdminSchema = new mongoose.Schema({
    SuperadminName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: Number,
        default: null,
    },    
    expirationTime: {
        type: Date,
        default: null,
    },
});

const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);
module.exports = SuperAdmin;