const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.KEY);

    const admin = await Admin.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });

    if (!admin) {
      throw new Error();
    }

    req.admin = admin;
    req.token = token;

    next();
  } catch (error) {
    res.status(401).send({ error: 'Non autorisé. Veuillez vous authentifier en tant qu\'administrateur.' });
  }
};

module.exports = authAdmin;
