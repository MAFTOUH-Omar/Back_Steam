const express = require('express');
const app = express();
const AuthRoute = require('./routes/auth.route')
const ServiceRoute = require('./routes/service.route')
const PackagesRoute = require('./routes/package.route')
const UserRoute = require('./routes/user.route')
const AdminRoute = require('./routes/admin.route')
const ThemeRoute = require('./routes/theme.route')
const SubscriptionRoute = require('./routes/subscription.route')
const ChannelRoute = require('./routes/channel.route')
const StatisticRoute = require('./routes/statistic.route')
const bodyParser = require('body-parser')
const i18n = require('./config/i18n');
const langMiddleware = require('./middlewares/lang.middleware');

const db = require("./config/db");
const cors = require('cors');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(langMiddleware);

// main
app.get('/', (req, res) => {
    res.json({ message: 'All Oki' });
});

// Auth User routes
app.use('/auth', AuthRoute);
//Service routes
app.use('/service' , ServiceRoute)
//Packages routes
app.use('/packages' , PackagesRoute)
//User routes
app.use('/user' , UserRoute)
//Admin routes
app.use('/admin' , AdminRoute)
//Theme Routes
app.use('/theme' , ThemeRoute)
//Subscription Routes
app.use('/subscription' , SubscriptionRoute)
//Subscription Routes
app.use('/channel' , ChannelRoute)
//Statistic Routes
app.use('/statistic' , StatisticRoute)
//Not Found Routes
app.use("*", (req, res) => {
    res.status(404).json({
        message: "Endpoint not found: The requested resource does not exist.",
        endpoint: req.originalUrl,
        timestamp: new Date(),
    });
});

db.connect();
const server = app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`);
});

module.exports = server;