const express = require('express');
const app = express();
const AuthRoute = require('./routes/auth.route');
const ServiceRoute = require('./routes/service.route');
const PackagesRoute = require('./routes/package.route');
const UserRoute = require('./routes/user.route');
const AdminRoute = require('./routes/admin.route');
const ThemeRoute = require('./routes/theme.route');
const SubscriptionRoute = require('./routes/subscription.route');
const ChannelRoute = require('./routes/channel.route');
const StatisticRoute = require('./routes/statistic.route');
const SuperAdminRoute = require('./routes/superAdmin.route');
const PayementRoute = require('./routes/payement.route');
const bodyParser = require('body-parser');
const langMiddleware = require('./middlewares/lang.middleware');
const path = require('path');
const db = require("./config/db");
const cors = require('cors');

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origin === 'https://store.thesmartiptv.com' || true) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(langMiddleware);

// Main
app.get('/', (req, res) => {
    res.send('All Oki');
});

// Auth User routes
app.use('/auth', AuthRoute);
// Service routes
app.use('/service', ServiceRoute);
// Packages routes
app.use('/packages', PackagesRoute);
// User routes
app.use('/user', UserRoute);
// Admin routes
app.use('/admin', AdminRoute);
// Theme Routes
app.use('/theme', ThemeRoute);
// Subscription Routes
app.use('/subscription', SubscriptionRoute);
// Channel Routes
app.use('/channel', ChannelRoute);
// Statistic Routes
app.use('/statistic', StatisticRoute);
// SuperAdmin Routes
app.use('/superAdmin', SuperAdminRoute);
// Payement Routes
app.use('/payement', PayementRoute);
// Service Picture Route
app.use("/service_picture/", express.static(path.join(__dirname, "Picture/service_picture")));
// Not Found Routes
app.use("*", (req, res) => {
    res.status(404).json({
        message: "Endpoint not found: The requested resource does not exist.",
        endpoint: req.originalUrl,
        timestamp: new Date(),
    });
});

db.connect();
app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`);
});