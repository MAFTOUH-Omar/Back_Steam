const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdmin.model');

const authSuperAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
    
        const decoded = jwt.verify(token, process.env.KEY);
    
        const superAdmin = await SuperAdmin.findOne({
            _id: decoded._id,
            'tokens.token': token,
        });
    
        if (!superAdmin) {
          throw new Error();
        }
    
        req.superAdmin = superAdmin;
        req.token = token;
    
        next();
    } catch (error) {
        res.status(401).send({ error: 'Unauthorized. Veuillez vous authentifier en tant qu\'administrateur principal.' });
    }
};

module.exports = authSuperAdmin;