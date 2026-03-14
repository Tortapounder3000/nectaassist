const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Sign up
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', 
  [username, hash], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'User created!' });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(401).json({ message: 'Wrong password' });

    res.json({ message: 'Login successful', user: results[0] });
  });
});

module.exports = router;