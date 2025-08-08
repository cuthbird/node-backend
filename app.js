const express = require('express');
const { Pool } = require('pg'); // Import the Pool class
const app = express();
const port = 3000;
// Configure the database connection pool
const pool = new Pool({
user: 'postgres', // Your PostgreSQL username
host: 'localhost',
database: 'restaurants_db', // The database you created
password:"password", // Your PostgreSQL password
port: 5432,
});


app.get('/', (req, res) => {
res.send('Hello from Node.js!');
});
app.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
});

app.get('/about', (req, res) => {
res.send('This API is created by CB!');
});


app.get('/restaurants', (req, res) => {
res.json(restaurants);
});

app.get('/restaurants', async (req, res) => {
try {
const result = await pool.query('SELECT * FROM restaurants ORDER BY id ASC');
res.json(result.rows);
} catch (err) {
console.error(err);
res.status(500).json({ error: "An internal server error occurred" });
}
});

app.use(express.json());

app.post('/restaurants', async (req, res) => {
const { name, cuisine, rating } = req.body;
if (!name || !cuisine || typeof rating !== 'number') {
return res.status(400).json({ error: "name, cuisine, and numeric rating are required" });
}
try {
const result = await pool.query(
'INSERT INTO restaurants (name, cuisine, rating) VALUES ($1, $2, $3) RETURNING *',
[name, cuisine, rating]
);
res.status(201).json(result.rows[0]);
} catch (err) {
console.error(err);
res.status(500).json({ error: "An internal server error occurred" });
}
});

app.delete('/restaurants/:id', async (req, res) => {
const { id } = req.params;
try {
const result = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING *', [id]);
if (result.rowCount === 0) {
// result.rowCount gives the number of deleted rows
return res.status(404).json({ error: "Restaurant not found" });
}
res.json(result.rows[0]); // Return the deleted item
} catch (err) {
console.error(err);
res.status(500).json({ error: "An internal server error occurred" });
}
});

app.put('/restaurants/:id', async (req, res) => {
const { id } = req.params;
const { name, cuisine, rating } = req.body;
// For simplicity, this example requires all fields. A more robust solution
// would dynamically build the query for partial updates.
if (!name || !cuisine || typeof rating !== 'number') {
return res.status(400).json({ error: "name, cuisine, and numeric rating are required" });
}
try {
const result = await pool.query(
'UPDATE restaurants SET name = $1, cuisine = $2, rating = $3 WHERE id = $4 RETURNING *',
[name, cuisine, rating, id]
);
if (result.rows.length === 0) {
return res.status(404).json({ error: "Restaurant not found" });
}
res.json(result.rows[0]);
} catch (err) {
console.error(err);
res.status(500).json({ error: "An internal server error occurred" });
}
});