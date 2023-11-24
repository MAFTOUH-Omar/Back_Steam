const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

const subscribe = async (req, res) => {
    try {
      const { FirstName, LastName, Country, phone, email, password } = req.body;
  
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      const encryptedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        FirstName: FirstName,
        LastName: LastName,
        Country: Country,
        phone: phone,
        email: email.toLowerCase(),
        password: encryptedPassword,
    }); 
  
        const token = jwt.sign({ user_id: user._id, email }, process.env.KEY,{ expiresIn: "3d" });
        user.token = token; 
      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    } 
  };

  
module.exports = { subscribe };