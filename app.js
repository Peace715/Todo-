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

let dbConnectionPromise = null;

// Optimized MongoDB connection
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    })
      .then((mongooseInstance) => {
        console.log('MongoDB Connected');
        return mongooseInstance.connection;
      })
      .catch((error) => {
        dbConnectionPromise = null;
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  return dbConnectionPromise;
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};

// Only use MongoStore outside testing
async function setupSessionStore() {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();

    sessionConfig.store = MongoStore.create({
      client: mongoose.connection.getClient(), // Reuse existing connection
      ttl: 14 * 24 * 60 * 60 // 14 days
    });
  }

  app.use(session(sessionConfig));
}

// Passport setup
function setupPassport() {
  if (!app.locals.passportInitialized) {
    require('./config/passport')(passport);
    app.locals.passportInitialized = true;
  }

  app.use(passport.initialize());
  app.use(passport.session());
}

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
function setupRoutes() {
  app.use('/', authRoutes);
  app.use('/tasks', taskRoutes);
}

// Start server
async function startServer() {
  try {
    await connectDB();
    await setupSessionStore();
    setupPassport();
    setupRoutes();

    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`
 Server is running!
 URL: http://localhost:${PORT}
 Environment: ${process.env.NODE_ENV || 'development'}
        `);
      });
    }

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
module.exports.app = app;
module.exports.connectDB = connectDB;
