const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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

serviceSchema.plugin(mongoosePaginate);
const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;