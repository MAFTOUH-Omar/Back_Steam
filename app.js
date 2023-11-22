const express = require('express');
const app = express();
const AuthRoute = require('./routes/auth.route')

const db = require("./config/db");
const path = require('path');
const cors = require('cors');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// main
app.get('/', (req, res) => {
    res.send('All Oki');
});

// Auth User routes
app.use('/auth', AuthRoute);

db.connect();
app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`);
});