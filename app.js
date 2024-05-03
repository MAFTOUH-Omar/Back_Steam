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

app.post('/stripe', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
      line_items: [
          {
              price_data: {
                  currency: 'usd',
                  product_data: {
                      name: 'Node.js and Express book'
                  },
                  unit_amount: 50 * 100
              },
              quantity: 1
          },
          {
              price_data: {
                  currency: 'usd',
                  product_data: {
                      name: 'JavaScript T-Shirt'
                  },
                  unit_amount: 20 * 100
              },
              quantity: 2
          }
      ],
      mode: 'payment',
      shipping_address_collection: {
          allowed_countries: ['US', 'BR']
      },
      success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cancel`
  })

  res.redirect(session.url)
})

app.get('/complete', async (req, res) => {
  const result = Promise.all([
      stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['payment_intent.payment_method'] }),
      stripe.checkout.sessions.listLineItems(req.query.session_id)
  ])

  console.log(JSON.stringify(await result))

  res.send('Your payment was successful')
})

app.get('/cancel', (req, res) => {
  res.redirect('/')
})

db.connect();
app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`);
});
