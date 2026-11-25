const express = require('express');
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, phone, profile_image_url, role, created_at FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', auth, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
  }
  try {
    const [result] = await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, profile_image_url, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
