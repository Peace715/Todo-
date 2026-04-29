require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');

const taskRoutes = require('./routes/task');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

async function connectDB() {
  if (mongoose.connection.readyState !== 0) {
    return mongoose.connection;
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
  return mongoose.connection;
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
};

if (process.env.NODE_ENV !== 'test') {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  });
}

app.use(session(sessionConfig));

if (!app.locals.passportInitialized) {
  require('./config/passport')(passport);
  app.locals.passportInitialized = true;
}

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/', authRoutes);
app.use('/tasks', taskRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
 Server is running!
 URL: http://localhost:${PORT}
 Environment: ${process.env.NODE_ENV || 'development'}
  `);
  });

  connectDB().catch((err) => console.log(err));
}

module.exports = { app, connectDB };
