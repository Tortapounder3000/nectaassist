const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user grades
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM grades WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add/update grade
router.post('/add', (req, res) => {
  const { user_id, subject, marks } = req.body;
  db.query('INSERT INTO grades (user_id, subject, marks) VALUES (?, ?, ?)', 
  [user_id, subject, marks], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Grade added!' });
  });
});

module.exports = router;
