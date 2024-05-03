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
const SuperAdminRoute = require('./routes/superAdmin.route')
const PayementRoute = require('./routes/payement.route')
const bodyParser = require('body-parser')
const langMiddleware = require('./middlewares/lang.middleware');
const path = require('path');


const db = require("./config/db");
const cors = require('cors');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(langMiddleware);
require("dotenv").config();
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
//Theme Routes
app.use('/theme' , ThemeRoute)
//Subscription Routes
app.use('/subscription' , SubscriptionRoute)
//Subscription Routes
app.use('/channel' , ChannelRoute)
//Statistic Routes
app.use('/statistic' , StatisticRoute)
//Statistic Routes
app.use('/superAdmin' , SuperAdminRoute)
//Statistic Routes
app.use('' , PayementRoute)
//Service Picture Route
app.use("/service_picture/", express.static(path.join(__dirname, "Picture/service_picture")));
//Not Found Routes



const stripe = require("stripe")("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

const storeItems = new Map([
  [1, { priceInCents: 100000, name: "Learn React Today" }],
  [2, { priceInCents: 20000, name: "Learn CSS Today" }],
]);

app.post("/stripe", async (req, res) => {
  try {
    const v = 1;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map(item => {
        const storeItem = storeItems.get(item.id);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.PAYPAL_RETURN_URL + '?subscriptionId=' + v}`,
      cancel_url: `${process.env.PAYPAL_CANCEL_URL + '?subscriptionId=' + v}`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
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
