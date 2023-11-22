const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.PASSWORD_EMAIL,
  },
});

module.exports = transporter;