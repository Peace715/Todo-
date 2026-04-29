const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

function validateCredentials(username, password) {
  if (!username || !password) {
    return 'Username and password are required';
  }

  if (username.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

// Root route: redirect based on authentication
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/tasks');
  }

  res.redirect('/login');
});

// Register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register form submission
router.post('/register', async (req, res) => {
  try {
    const username = req.body.username ? req.body.username.trim() : '';
    const password = req.body.password;
    const validationError = validateCredentials(username, password);

    if (validationError) {
      return res.status(400).render('register', { error: validationError });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).render('register', { error: 'Username already exists' });
    }

    await User.create({ username, password });
    return res.redirect('/login');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login form submission
router.post('/login', (req, res, next) => {
  const username = req.body.username ? req.body.username.trim() : '';
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).render('login', { error: 'Username and password are required' });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).render('login', {
        error: info && info.message ? info.message : 'Invalid username or password'
      });
    }

    return req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect('/tasks');
    });
  })(req, res, next);
});

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    return res.redirect('/login');
  });
});

module.exports = router;
