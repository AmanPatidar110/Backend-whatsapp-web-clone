const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const LoginMiddleware = require('./middlewares/LoginMiddleware')
const authRoutes = require('./routes/auth');
const statusRoutes = require('./routes/status');
const chatRoutes = require('./routes/chat');
const User = require('./models/user');
const Message = require('./models/messages');


const app = express();
const port = process.env.PORT || 5000


const MongoURI =  process.env.MONGO_URI;

mongoose.connect(MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to DB!');
}).catch(err => {console.log(err)});

app.use(compression());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    next();
  });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/auth', LoginMiddleware, authRoutes);
app.use('/chat', LoginMiddleware, chatRoutes);
app.use('/status', LoginMiddleware, statusRoutes);

app.use('/images', express.static(path.join('images')));
app.use('/chataudio', express.static(path.join('chataudio')));


app.use((error, req, res, next) => {
  if (!error.statusCode) error.statusCode = 500;
  if (!error.message) error.message = "Server side error";
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;

  res.status(status).json({ message: message, data: data });
});






const server = app.listen(port, () => {
    console.log(`Listening on PORT: ${port}...`);
});

module.exports = {server}
 