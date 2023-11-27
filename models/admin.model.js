const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

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
    dernierToken: {
        type: String,
    },
    tokens: [{
        token: {
          type: String,
          required: true,
        },
    }],
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
});

adminSchema.statics.findByCredentials = async function (email, password) {
    const admin = await this.findOne({ email });
  
    if (!admin) {
      throw new Error('Identifiants invalides');
    }
  
    const isPasswordValid = await bcrypt.compare(password, admin.password);
  
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }
  
    return admin;
  };
  
  const Admin = mongoose.model('Admin', adminSchema);
  
  module.exports = Admin;