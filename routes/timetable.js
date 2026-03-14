const express = require('express');
const router = express.Router();
const db = require('../db');

// Get timetable for a user
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM timetable WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add or update timetable
router.post('/update', (req, res) => {
  const { user_id, day, period, subject } = req.body;
  db.query('REPLACE INTO timetable (user_id, day, period, subject) VALUES (?, ?, ?, ?)',
  [user_id, day, period, subject], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Timetable updated!' });
  });
});

module.exports = router;

