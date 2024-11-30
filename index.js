const pool = require('./db')
const express = require('express');
const {body, validationResult} = require('express-validator');

const app = express();
const port = process.env.DB_PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World'); // Respond with "Hello World"
});

//endpoint for getting the last 10 rows
app.get('/data',async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM motion_data ORDER BY timestamp DESC LIMIT 10');
        res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (err) {
        next(err);
    }
});
//Endpoint for getting the last data row
app.get('/latest-data', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM motion_data ORDER BY timestamp DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No data found' });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0], 
        });
    } catch (err) {
        next(err); 
    }
});

// POST route to receive and log sensor data
app.post('/sensor-data', [
    body('x').isFloat().withMessage('x must be a number'),
    body('y').isFloat().withMessage('y must be a number'),
    body('z').isFloat().withMessage('z must be a number'),
],
    async (req, res, next) => {
        const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const { x, y, z } = req.body;
    

    try {
        const query = 'INSERT INTO motion_data (x, y, z) VALUES ($1, $2, $3) RETURNING *';
        const values = [x, y, z];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Data inserted successfully',
            data: result.rows[0], // Return the inserted row
        });
    } catch (err) {
       next(err);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Logs the full error stack
    res.status(500).send(err.message || 'Something went wrong!');
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
