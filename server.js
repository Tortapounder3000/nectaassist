const express = require('express');
console.log("!!! THE SERVER IS STARTING NOW !!!");
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) console.error('❌ MySQL connection failed:', err);
  else console.log('✅ Connected to MySQL');
});

// --- AUTHENTICATION ---

app.post('/api/auth/login', (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  console.log(`Login attempt for: [${username}]`);

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];
    if (user.password === password) {
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  console.log("Attempting signup for:", username);
  
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, results) => {
    if (err) {
      console.error("❌ SIGNUP ERROR:", err);
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username taken' });
      return res.status(500).json({ error: 'DB error', details: err.message });
    }
    res.json({ success: true, userId: results.insertId });
  });
});

app.put('/api/auth/update-password', (req, res) => {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
        return res.status(400).json({ success: false, error: "Missing data" });
    }

    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(sql, [newPassword, userId], (err, result) => {
        if (err) {
            console.error("❌ UPDATE ERROR:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        console.log(`✅ Password updated for user ID: ${userId}`);
        res.json({ success: true, message: "Password updated successfully" });
    });
});

// --- ASSIGNMENTS ---

app.get('/api/assignments/:userId', (req, res) => {
  console.log(`Fetching tasks for user: ${req.params.userId}`);
  db.query('SELECT * FROM assignments WHERE userId = ?', [req.params.userId], (err, results) => {
    if (err) {
      console.error("❌ GET ERROR:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, assignments: results });
  });
});

app.post('/api/assignments/add', (req, res) => {
  const { userId, title, subject, due_date, priority, description } = req.body;
  console.log("Adding task for user:", userId);
  
  const sql = 'INSERT INTO assignments (userId, title, subject, due_date, priority, description) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [userId, title, subject, due_date, priority, description], (err, result) => {
    if (err) {
      console.error("❌ POST ERROR:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log("✅ Task added successfully!");
    res.json({ success: true });
  });
});

app.delete('/api/assignments/delete/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM assignments WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/assignments/update/:id', (req, res) => {
    const { id } = req.params;
    const { title, subject, due_date, priority, description } = req.body;
    
    const sql = `UPDATE assignments 
                 SET title = ?, subject = ?, due_date = ?, priority = ?, description = ? 
                 WHERE id = ?`;

    db.query(sql, [title, subject, due_date, priority, description, id], (err, result) => {
        if (err) {
            console.error("❌ UPDATE ERROR:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`✅ Task ID ${id} updated!`);
        res.json({ success: true });
    });
});

app.patch('/api/assignments/toggle/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'UPDATE assignments SET completed = NOT completed WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// --- TIMETABLE ROUTES ---

app.get('/api/timetable/:userId', (req, res) => {
    const sql = 'SELECT cellId, content FROM timetable WHERE userId = ?';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) {
            console.error("❌ TIMETABLE FETCH ERROR:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

app.post('/api/timetable/save', (req, res) => {
    const { userId, cellId, content } = req.body;
    const sql = `INSERT INTO timetable (userId, cellId, content) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE content = VALUES(content)`;
    
    db.query(sql, [userId, cellId, content], (err, result) => {
        if (err) {
            console.error("Timetable Save Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// --- DEADLINES ROUTES ---

app.get('/api/deadlines/:userId', (req, res) => {
    const sql = 'SELECT id, task_text FROM deadlines WHERE userId = ?';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

app.post('/api/deadlines/add', (req, res) => {
    const { userId, text } = req.body;
    const sql = 'INSERT INTO deadlines (userId, task_text) VALUES (?, ?)';
    db.query(sql, [userId, text], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

app.delete('/api/deadlines/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM deadlines WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// --- GRADES / DASHBOARD ROUTES ---

app.get('/api/grades/:userId', (req, res) => {
    const sql = 'SELECT id, subject_name, mark FROM grades WHERE userId = ?';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

app.post('/api/grades/save', (req, res) => {
    const { userId, subject_name, mark } = req.body;
    const sql = `INSERT INTO grades (userId, subject_name, mark) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE mark = VALUES(mark)`;
    
    db.query(sql, [userId, subject_name, mark], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/grades/clear/:userId', (req, res) => {
    db.query('DELETE FROM grades WHERE userId = ?', [req.params.userId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVER IS LIVE on port ${PORT}`);
});
