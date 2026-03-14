const express = require('express');
const router = express.Router();

// 1. Get all assignments for a user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  // Note: Changed user_id to userId to match your likely table structure
  const sql = 'SELECT * FROM assignments WHERE userId = ? ORDER BY due_date ASC';
  
  req.db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Fetch Error:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, assignments: results });
  });
});

// 2. Add new assignment
router.post('/add', (req, res) => {
  const { userId, title, subject, due_date, description, priority, notes } = req.body;
  
  console.log("📥 Data received at /add:", req.body);

  if (!userId || !title || !subject || !due_date) {
    return res.status(400).json({ error: 'Missing required fields: userId, title, subject, or due_date' });
  }

  const sql = 'INSERT INTO assignments (userId, title, subject, due_date, description, priority, notes, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 0)';
  
  req.db.query(
    sql,
    [userId, title, subject, due_date, description || '', priority || 'Medium', notes || ''],
    (err, result) => {
      if (err) {
        console.error("❌ SQL Insert Error:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }
      res.json({ 
        success: true, 
        message: 'Assignment added',
        assignmentId: result.insertId 
      });
    }
  );
});

// 3. Update assignment
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { title, subject, due_date, description, priority, notes, completed } = req.body;
  
  const sql = 'UPDATE assignments SET title = ?, subject = ?, due_date = ?, description = ?, priority = ?, notes = ?, completed = ? WHERE id = ?';
  
  req.db.query(
    sql,
    [title, subject, due_date, description, priority, notes, completed ? 1 : 0, id],
    (err) => {
      if (err) {
        console.error("❌ Update Error:", err);
        return res.status(500).json({ error: 'Failed to update assignment' });
      }
      res.json({ success: true, message: 'Assignment updated' });
    }
  );
});

// 4. Toggle completion status
router.patch('/toggle/:id', (req, res) => {
  const { id } = req.params;
  req.db.query(
    'UPDATE assignments SET completed = NOT completed WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to toggle assignment' });
      }
      res.json({ success: true, message: 'Assignment status updated' });
    }
  );
});

// 5. Delete assignment
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  req.db.query('DELETE FROM assignments WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete assignment' });
    }
    res.json({ success: true, message: 'Assignment deleted' });
  });
});

module.exports = router;