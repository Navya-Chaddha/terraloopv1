const express = require('express');
const pool = require('../db');
const auth = require('../middleware/authMiddleware');
const { isValidImageDataUrl } = require('../utils/imageData');

const router = express.Router();

// Require grocer role
function requireGrocer(req, res, next) {
  if (req.user.role !== 'grocer') return res.status(403).json({ error: 'Grocer role required' });
  next();
}

// Create listing
router.post('/', auth, requireGrocer, async (req, res) => {
  const body = req.body;
  const product_name = body.product_name || body.fruit_name || body.fruitName;
  const quantity = Number(body.quantity);
  const unit = body.unit || 'kg';
  const original_price = Number(body.original_price ?? body.price);
  const discounted_price = Number(body.discounted_price ?? body.price ?? original_price);
  const images = Array.isArray(body.images) ? body.images : [];
  const image_url = body.image_url || images[0] || '';
  if (!product_name || !body.category || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(original_price) || original_price <= 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (typeof image_url !== 'string' || (image_url.startsWith('data:') && !isValidImageDataUrl(image_url))) {
    return res.status(400).json({ error: 'Invalid listing image' });
  }
  if (images.length > 4 || images.some((image) =>
    typeof image !== 'string' || (image.startsWith('data:') && !isValidImageDataUrl(image))
  )) {
    return res.status(400).json({ error: 'Invalid listing images' });
  }
  const analysis = {
    freshness: Number(body.freshness) || 0,
    shelfLife: body.shelfLife || null,
    verdict: body.verdict || null,
    recommendedUses: Array.isArray(body.recommendedUses) ? body.recommendedUses : [],
    alternativeUses: Array.isArray(body.alternativeUses) ? body.alternativeUses : [],
    qualityGrade: body.qualityGrade || null,
  };
  const latitude = body.latitude != null && Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null;
  const longitude = body.longitude != null && Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null;
  try {
    const sql = `INSERT INTO listings (grocer_id, product_name, category, description, quantity, unit, original_price, discounted_price, image_url, images, analysis_json, location, expiry_date, latitude, longitude) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [
      req.user.id,
      product_name,
      body.category,
      body.description || analysis.verdict || '',
      quantity,
      unit,
      original_price,
      discounted_price || original_price,
      image_url,
      images.length ? JSON.stringify(images) : JSON.stringify(image_url ? [image_url] : []),
      JSON.stringify(analysis),
      body.location || body.grocer_location || body.grocerLocation || '',
      body.expiry_date || null,
      latitude,
      longitude,
    ];
    const [result] = await pool.execute(sql, params);
    const [rows] = await pool.execute(
      'SELECT l.*, u.name AS grocer_name, u.phone AS grocer_phone FROM listings l JOIN users u ON l.grocer_id = u.id WHERE l.id = ?',
      [result.insertId]
    );
    res.status(201).json({ listing: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all available listings (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT l.*, u.name AS grocer_name, u.phone AS grocer_phone FROM listings l JOIN users u ON l.grocer_id = u.id WHERE l.status = 'available'"
    );
    res.json({ listings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my listings (grocer only)
router.get('/my', auth, requireGrocer, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT l.*, u.name AS grocer_name, u.phone AS grocer_phone FROM listings l JOIN users u ON l.grocer_id = u.id WHERE l.grocer_id = ? ORDER BY l.created_at DESC',
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single listing (public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT l.*, u.name AS grocer_name, u.phone AS grocer_phone FROM listings l JOIN users u ON l.grocer_id = u.id WHERE l.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ listing: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update listing (owner only)
router.put('/:id', auth, requireGrocer, async (req, res) => {
  const { id } = req.params;
  const fields = [
    'product_name',
    'category',
    'description',
    'quantity',
    'unit',
    'original_price',
    'discounted_price',
    'image_url',
    'images',
    'analysis_json',
    'location',
    'latitude',
    'longitude',
    'expiry_date',
    'status',
  ];
  if (req.body.image_url && (typeof req.body.image_url !== 'string' || (req.body.image_url.startsWith('data:') && !isValidImageDataUrl(req.body.image_url)))) {
    return res.status(400).json({ error: 'Invalid listing image' });
  }
  const updates = [];
  const params = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  try {
    const [ownerRows] = await pool.execute('SELECT grocer_id FROM listings WHERE id = ?', [id]);
    if (!ownerRows.length) return res.status(404).json({ error: 'Listing not found' });
    if (ownerRows[0].grocer_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });
    const sql = `UPDATE listings SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);
    await pool.execute(sql, params);
    const [rows] = await pool.execute('SELECT * FROM listings WHERE id = ?', [id]);
    res.json({ listing: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete listing (owner only)
router.delete('/:id', auth, requireGrocer, async (req, res) => {
  const { id } = req.params;
  try {
    const [ownerRows] = await pool.execute('SELECT grocer_id FROM listings WHERE id = ?', [id]);
    if (!ownerRows.length) return res.status(404).json({ error: 'Listing not found' });
    if (ownerRows[0].grocer_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });
    await pool.execute('DELETE FROM listings WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change status (owner only)
router.patch('/:id/status', auth, requireGrocer, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['available', 'sold', 'expired'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const [ownerRows] = await pool.execute('SELECT grocer_id FROM listings WHERE id = ?', [id]);
    if (!ownerRows.length) return res.status(404).json({ error: 'Listing not found' });
    if (ownerRows[0].grocer_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });
    await pool.execute('UPDATE listings SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await pool.execute('SELECT * FROM listings WHERE id = ?', [id]);
    res.json({ listing: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
