const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminName: {
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
    lastConnect: {
        type: Date,
        default: null,
    },
});

const Admin = mongoose.model('AdminSteam', adminSchema);
module.exports = Admin;