const jwt = require('jsonwebtoken');
const userModel = require("../models/user.model");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const secretKey = req.headers.secret_key;

    if (!token || !secretKey) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No token or secret key provided." });
    }

    if (secretKey !== process.env.KEY) {
      return res.status(401).json({ message: "Authentication failed: Invalid secret key." });
    }

    const { id } = jwt.verify(token, process.env.KEY);
    const user = await userModel.findById(id, { password: 0 });

    if (!user) {
      return res.status(401).json({ message: "Authentication failed: User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed: Invalid token." });
  }
};

module.exports = auth;
