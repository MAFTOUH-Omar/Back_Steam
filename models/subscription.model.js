const mongoose = require('mongoose');
const User = require('./user.model')

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deviceType: {
        type: String,
        enum: ['m3u', 'mac', 'activeCode'],
        required: true,
    },
    deviceDetails: {
        m3u: {
            userName: { type: String },
            password: { type: String },
        },
        mac: {
            macAddress: { type: String },
        },
        activeCode: {
            code: { type: String },
        },
    },
    liveBouquet: [
        {
            type: String,
            required: true,
        },
    ],
    seriesBouquet: [
        {
            type: String,
            required: true,
        },
    ],
    vodBouquet: [
        {
            type: String,
            required: true,
        },
    ],
    paymentMethod: {
        type: String,
        enum: ['paypal', 'stripe', 'googlePay', 'crypto'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    activationStatus: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;