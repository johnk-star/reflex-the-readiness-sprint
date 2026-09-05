require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
const port = Number(process.env.PORT || 3000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reflex_db',
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(express.json());

const validStatuses = new Set([
  'REQUESTED',
  'ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
]);

function requiredFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === '');
}

async function getUser(userId, connection = pool) {
  const [rows] = await connection.execute(
    'SELECT user_id, role FROM users WHERE user_id = ?',
    [userId]
  );
  return rows[0];
}

app.get('/', (request, response) => {
  response.json({ message: 'Reflex API is running successfully!' });
});

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.post('/api/deliveries', async (request, response, next) => {
  const missing = requiredFields(request.body, [
    'retailer_id',
    'customer_name',
    'customer_phone',
    'delivery_address',
    'item_description',
    'product_id',
    'created_by',
  ]);
  if (missing.length) {
    return response.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const connection = await pool.getConnection();
  try {
    const creator = await getUser(request.body.created_by, connection);
    if (!creator || creator.role !== 'RETAILER') {
      return response.status(403).json({ error: 'created_by must be a retailer user' });
    }

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO deliveries
        (retailer_id, customer_name, customer_phone, delivery_address,
         item_description, product_id, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        request.body.retailer_id,
        request.body.customer_name,
        request.body.customer_phone,
        request.body.delivery_address,
        request.body.item_description,
        request.body.product_id,
        request.body.quantity || 1,
      ]
    );

    await connection.execute(
      `INSERT INTO status_updates (delivery_id, status, updated_by)
       VALUES (?, 'REQUESTED', ?)`,
      [result.insertId, request.body.created_by]
    );
    await connection.commit();
    response.status(201).json({ delivery_id: result.insertId, status: 'REQUESTED' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get('/api/deliveries', async (request, response, next) => {
  try {
    const parameters = [];
    let query = `SELECT d.*, p.product_name, p.size_or_variant,
        a.rider_id, rider.name AS rider_name
      FROM deliveries d
      JOIN products p ON p.product_id = d.product_id
      LEFT JOIN assignments a ON a.delivery_id = d.delivery_id AND a.unassigned_at IS NULL
      LEFT JOIN users rider ON rider.user_id = a.rider_id`;
    if (request.query.status) {
      if (!validStatuses.has(request.query.status)) {
        return response.status(400).json({ error: 'Invalid status filter' });
      }
      query += ' WHERE d.status = ?';
      parameters.push(request.query.status);
    }
    query += ' ORDER BY d.created_at DESC';
    const [rows] = await pool.execute(query, parameters);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/deliveries/:deliveryId/assign', async (request, response, next) => {
  const { deliveryId } = request.params;
  const { rider_id: riderId, assigned_by: dispatcherId } = request.body;
  if (!riderId || !dispatcherId) {
    return response.status(400).json({ error: 'rider_id and assigned_by are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[delivery]] = await connection.execute(
      'SELECT delivery_id, status FROM deliveries WHERE delivery_id = ? FOR UPDATE',
      [deliveryId]
    );
    const rider = await getUser(riderId, connection);
    const dispatcher = await getUser(dispatcherId, connection);

    if (!delivery) {
      await connection.rollback();
      return response.status(404).json({ error: 'Delivery not found' });
    }
    if (!rider || rider.role !== 'RIDER') {
      await connection.rollback();
      return response.status(400).json({ error: 'User is not a rider' });
    }
    if (!dispatcher || dispatcher.role !== 'DISPATCHER') {
      await connection.rollback();
      return response.status(403).json({ error: 'User is not a dispatcher' });
    }
    if (delivery.status !== 'REQUESTED') {
      await connection.rollback();
      return response.status(409).json({ error: 'Delivery is not available for assignment' });
    }

    const [result] = await connection.execute(
      `INSERT INTO assignments (delivery_id, rider_id, assigned_by)
       VALUES (?, ?, ?)`,
      [deliveryId, riderId, dispatcherId]
    );
    await connection.commit();
    response.status(201).json({ assignment_id: result.insertId, delivery_id: Number(deliveryId), rider_id: riderId });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'Delivery already has an active assignment' });
    next(error);
  } finally {
    connection.release();
  }
});

app.post('/api/deliveries/:deliveryId/status', async (request, response, next) => {
  const { deliveryId } = request.params;
  const { status, updated_by: updatedBy } = request.body;
  if (!validStatuses.has(status) || !updatedBy) {
    return response.status(400).json({ error: 'A valid status and updated_by are required' });
  }

  try {
    const user = await getUser(updatedBy);
    if (!user) return response.status(401).json({ error: 'Updating user not found' });
    const [[delivery]] = await pool.execute(
      `SELECT d.status, a.rider_id
       FROM deliveries d
       LEFT JOIN assignments a ON a.delivery_id = d.delivery_id AND a.unassigned_at IS NULL
       WHERE d.delivery_id = ?`,
      [deliveryId]
    );
    if (!delivery) return response.status(404).json({ error: 'Delivery not found' });
    const canUpdate =
      (status === 'CANCELLED' && ['RETAILER', 'DISPATCHER'].includes(user.role)) ||
      (['PICKED_UP', 'DELIVERED'].includes(status) && user.role === 'RIDER' && delivery.rider_id === user.user_id);
    if (!canUpdate) return response.status(403).json({ error: 'User cannot apply this status update' });
    await pool.execute(
      'INSERT INTO status_updates (delivery_id, status, updated_by) VALUES (?, ?, ?)',
      [deliveryId, status, updatedBy]
    );
    response.status(201).json({ delivery_id: Number(deliveryId), status });
  } catch (error) {
    if (error.sqlState === '45000') return response.status(409).json({ error: error.message });
    next(error);
  }
});

app.get('/api/deliveries/:deliveryId/history', async (request, response, next) => {
  try {
    const [statusUpdates] = await pool.execute(
      `SELECT s.status, s.updated_at, u.name AS updated_by_name
       FROM status_updates s JOIN users u ON u.user_id = s.updated_by
       WHERE s.delivery_id = ? ORDER BY s.updated_at`,
      [request.params.deliveryId]
    );
    const [assignments] = await pool.execute(
      `SELECT a.assigned_at, a.unassigned_at, rider.name AS rider_name,
          dispatcher.name AS assigned_by_name
       FROM assignments a
       JOIN users rider ON rider.user_id = a.rider_id
       JOIN users dispatcher ON dispatcher.user_id = a.assigned_by
       WHERE a.delivery_id = ? ORDER BY a.assigned_at`,
      [request.params.deliveryId]
    );
    response.json({ status_updates: statusUpdates, assignments });
  } catch (error) {
    next(error);
  }
});

app.post('/api/deliveries/:deliveryId/confirm', async (request, response, next) => {
  const { confirmation_code: code, scanned_by: scannedBy, result } = request.body;
  if (!code || !scannedBy || !['SUCCESSFUL', 'FAILED'].includes(result)) {
    return response.status(400).json({ error: 'confirmation_code, scanned_by, and a valid result are required' });
  }
  try {
    const user = await getUser(scannedBy);
    const [[assignment]] = await pool.execute(
      `SELECT rider_id FROM assignments
       WHERE delivery_id = ? AND unassigned_at IS NULL`,
      [request.params.deliveryId]
    );
    if (!user || user.role !== 'RIDER' || !assignment || assignment.rider_id !== user.user_id) {
      return response.status(403).json({ error: 'Only the assigned rider can submit a confirmation' });
    }
    const [insert] = await pool.execute(
      `INSERT INTO delivery_confirmations (delivery_id, scanned_by, confirmation_code, result)
       VALUES (?, ?, ?, ?)`,
      [request.params.deliveryId, scannedBy, code, result]
    );
    response.status(201).json({ confirmation_id: insert.insertId, result });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Reflex API listening on http://localhost:${port}`);
});
