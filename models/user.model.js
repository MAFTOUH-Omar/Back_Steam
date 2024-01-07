const mongoose = require("mongoose");
var userSchema = new mongoose.Schema({
    FirstName: {
        type: String,
        required: [true, "first Name not provided "],
    },
    LastName: {
        type: String,
        required: [true, "last Name not provided "],
    },
    Country: {
        type: String,
        required: [true, "Country not provided "],
    },
    phone : {
        type : String,
        required : [true,"phone not provided"],    
    },
    email: {
        type: String,
        unique: [true, "email already exists in database!"],
        lowercase: true,
        trim: true,
        required: [true, "email not provided"],
        validate: {
        validator: function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '{VALUE} is not a valid email!'
        }
    },
    password: {
        type: String,
        required: true
    },
    confirmed: {
        type: Boolean,
        default: false,
    },
    banned: {
        type: Boolean,
        default: false,
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("user", userSchema);