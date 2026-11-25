const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { isValidImageDataUrl } = require('../utils/imageData');
require('dotenv').config();

const router = express.Router();

// Helper to validate Indian phone number
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Registration endpoint
router.post('/register', async (req, res) => {
  const { name, phone, email, password, role, profile_image_url } = req.body;
  if (!name || !phone || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (profile_image_url && !isValidImageDataUrl(profile_image_url)) {
    return res.status(400).json({ error: 'Invalid profile image' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Invalid Indian phone number' });
  }
  if (!['grocer','buyer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO users (name, phone, email, password, profile_image_url, role) VALUES (?,?,?,?,?,?)`;
    await pool.execute(sql, [name, phone, email, hash, profile_image_url || null, role]);
    // Get the newly created user id
    const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, profile_image_url: user.profile_image_url, role: user.role } });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Phone or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint – can use phone or email
router.post('/login', async (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required' });
  }
  if (role && !['grocer', 'buyer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const sql = identifier.includes('@')
      ? 'SELECT * FROM users WHERE email = ?'
      : 'SELECT * FROM users WHERE phone = ?';
    const [rows] = await pool.execute(sql, [identifier]);
    const user = rows[0];
    if (!user || (role && user.role !== role)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, profile_image_url: user.profile_image_url, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
