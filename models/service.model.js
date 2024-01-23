const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name not provided"],
    },
    credit: {
        type: Number,
        default: 0,
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }],
    active : {
        type : Boolean ,
        default : true
    },
    ServicePicture: {
        type: String,
    },
    description: {
        type: String,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;