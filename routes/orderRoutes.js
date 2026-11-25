const express = require('express');
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Buyer-only middleware
function requireBuyer(req, res, next) {
  if (req.user.role !== 'buyer') return res.status(403).json({ error: 'Buyer role required' });
  next();
}

// Reserve all cart items atomically.
router.post('/checkout', auth, requireBuyer, async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return res.status(400).json({ error: 'A cart with 1 to 20 items is required' });
  }
  const reservations = items.map((item) => ({
    listingId: Number(item?.listing_id),
    quantity: Number(item?.quantity),
  }));
  if (reservations.some((item) => !Number.isInteger(item.listingId) || item.listingId <= 0 || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    return res.status(400).json({ error: 'Each cart item needs a valid listing and quantity' });
  }
  if (new Set(reservations.map((item) => item.listingId)).size !== reservations.length) {
    return res.status(400).json({ error: 'A listing may only appear once in the cart' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const orders = [];
    for (const item of reservations) {
      const [listRows] = await connection.execute(
        'SELECT * FROM listings WHERE id = ? AND status = ? FOR UPDATE',
        [item.listingId, 'available']
      );
      if (!listRows.length) {
        throw new Error('One or more listings are no longer available');
      }
      const listing = listRows[0];
      const available = Number(listing.quantity);
      if (item.quantity > available) {
        throw new Error(`Only ${available} ${listing.unit} available for ${listing.product_name}`);
      }
      const totalPrice = Number(listing.discounted_price) * item.quantity;
      const [result] = await connection.execute(
        'INSERT INTO orders (buyer_id, listing_id, quantity, total_price) VALUES (?,?,?,?)',
        [req.user.id, item.listingId, item.quantity, totalPrice]
      );
      const remaining = Math.max(0, available - item.quantity);
      await connection.execute(
        'UPDATE listings SET quantity = ?, status = ? WHERE id = ?',
        [remaining, remaining === 0 ? 'sold' : 'available', item.listingId]
      );
      orders.push({
        id: result.insertId,
        listing_id: item.listingId,
        product_name: listing.product_name,
        image_url: listing.image_url,
        quantity: item.quantity,
        total_price: totalPrice,
      });
    }
    await connection.commit();
    res.status(201).json({ orders });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err instanceof Error && !('code' in err)) {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
});

// Reserve an available quantity (buyer)
router.post('/', auth, requireBuyer, async (req, res) => {
  const { listing_id, quantity } = req.body;
  const requested = Number(quantity);
  if (!listing_id || !Number.isFinite(requested) || requested <= 0) {
    return res.status(400).json({ error: 'A listing and a valid quantity are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [listRows] = await connection.execute(
      'SELECT * FROM listings WHERE id = ? AND status = ? FOR UPDATE',
      [listing_id, 'available']
    );
    if (!listRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Listing not available' });
    }

    const listing = listRows[0];
    const available = Number(listing.quantity);
    if (requested > available) {
      await connection.rollback();
      return res.status(409).json({ error: `Only ${available} ${listing.unit} available` });
    }

    const total_price = Number(listing.discounted_price) * requested;
    const [result] = await connection.execute(
      'INSERT INTO orders (buyer_id, listing_id, quantity, total_price) VALUES (?,?,?,?)',
      [req.user.id, listing_id, requested, total_price]
    );
    const remaining = Math.max(0, available - requested);
    const nextStatus = remaining === 0 ? 'sold' : 'available';
    await connection.execute(
      'UPDATE listings SET quantity = ?, status = ? WHERE id = ?',
      [remaining, nextStatus, listing_id]
    );
    const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    await connection.commit();
    res.status(201).json({ order: rows[0] });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
});

// Get buyer's own orders
router.get('/my', auth, requireBuyer, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT o.*, l.product_name, l.image_url
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       WHERE o.buyer_id = ?`,
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single order (buyer can only view his own)
router.get('/:id', auth, requireBuyer, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT o.*, l.product_name, l.image_url
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       WHERE o.id = ? AND o.buyer_id = ?`,
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
