const express = require('express');
const app = express();
const AuthRoute = require('./routes/auth.route')
const ServiceRoute = require('./routes/service.route')
const PackagesRoute = require('./routes/package.route')
const UserRoute = require('./routes/user.route')
const AdminRoute = require('./routes/admin.route')
const ThemeRoute = require('./routes/theme.route')
const bodyParser = require('body-parser')

const db = require("./config/db");
const cors = require('cors');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())

// main
app.get('/', (req, res) => {
    res.send('All Oki');
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
//Not Found Routes
app.use('/theme' , ThemeRoute)
//Not Found Routes
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