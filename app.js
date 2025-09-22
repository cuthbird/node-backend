const express = require('express');
const { Pool } = require('pg'); // Import the Pool class
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// Configure the database connection pool
const pool = new Pool({
  user: 'postgres', // Your PostgreSQL username
  host: 'localhost',
  database: 'restaurants_db', // The database you created
  password: '123', // Your PostgreSQL password
  port: 5432,
});

app.use(express.json());

// Apply rate limiting middleware to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Default routes
app.get('/', (req, res) => {
  res.send('Hello from Node.js!');
});

app.get('/about', (req, res) => {
  res.send('This API is created by Kevin!');
});

// Get all restaurants
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurants ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// Get a single restaurant by ID
app.get('/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// Add a new restaurant
app.post('/restaurants', async (req, res) => {
  const { name, cuisine, rating } = req.body;

  if (!name || !cuisine || typeof rating !== 'number') {
    return res.status(400).json({
      error: 'name, cuisine, and numeric rating are required',
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO restaurants (name, cuisine, rating) VALUES ($1, $2, $3) RETURNING *',
      [name, cuisine, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// Delete a restaurant
app.delete('/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM restaurants WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(result.rows[0]); // Return the deleted item
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// Update a restaurant
app.put('/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, cuisine, rating } = req.body;

  if (!name || !cuisine || typeof rating !== 'number') {
    return res.status(400).json({
      error: 'name, cuisine, and numeric rating are required',
    });
  }

  try {
    const result = await pool.query(
      'UPDATE restaurants SET name = $1, cuisine = $2, rating = $3 WHERE id = $4 RETURNING *',
      [name, cuisine, rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// Only start the server if the file is run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Export the app for testing
module.exports = app;
