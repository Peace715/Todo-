const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

function buildDashboardPayload(user, tasks, error) {
  return {
    user,
    tasks,
    error,
    now: new Date()
  };
}

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/login');
}

// Dashboard - list tasks for logged-in user
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ dueAt: 1, createdAt: -1 });
    return res.render('dashboard', buildDashboardPayload(req.user, tasks));
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// Add new task
router.post('/add', isLoggedIn, async (req, res) => {
  try {
    const title = req.body.title ? req.body.title.trim() : '';
    const dueAtValue = req.body.dueAt ? req.body.dueAt.trim() : '';
    const dueAt = dueAtValue ? new Date(dueAtValue) : null;

    if (!title) {
      const tasks = await Task.find({ user: req.user._id }).sort({ dueAt: 1, createdAt: -1 });
      return res.status(400).render('dashboard', buildDashboardPayload(req.user, tasks, 'Task title is required'));
    }

    if (dueAtValue && Number.isNaN(dueAt.getTime())) {
      const tasks = await Task.find({ user: req.user._id }).sort({ dueAt: 1, createdAt: -1 });
      return res.status(400).render('dashboard', buildDashboardPayload(req.user, tasks, 'Please choose a valid reminder time'));
    }

    if (dueAt && dueAt.getTime() < Date.now()) {
      const tasks = await Task.find({ user: req.user._id }).sort({ dueAt: 1, createdAt: -1 });
      return res.status(400).render('dashboard', buildDashboardPayload(req.user, tasks, 'Please choose a reminder time in the future'));
    }

    await Task.create({
      title,
      dueAt,
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
