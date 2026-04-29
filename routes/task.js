const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/login');
}

// Dashboard - list tasks for logged-in user
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    return res.render('dashboard', { user: req.user, tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// Add new task
router.post('/add', isLoggedIn, async (req, res) => {
  try {
    const title = req.body.title ? req.body.title.trim() : '';

    if (!title) {
      const tasks = await Task.find({ user: req.user._id });
      return res.status(400).render('dashboard', {
        user: req.user,
        tasks,
        error: 'Task title is required'
      });
    }

    await Task.create({
      title,
      user: req.user._id,
      status: 'pending'
    });

    return res.redirect('/tasks');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// Mark task as completed
router.post('/complete/:id', isLoggedIn, async (req, res) => {
  try {
    await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'completed' }
    );

    return res.redirect('/tasks');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// Delete a task
router.post('/delete/:id', isLoggedIn, async (req, res) => {
  try {
    await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    return res.redirect('/tasks');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
