const pool = require('./db');
const path = require('path');
const express = require('express');
const {body, validationResult} = require('express-validator');

const app = express();
const port = process.env.DB_PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home_page.html'));
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
app.post(
    '/sensor-data',
    [
        body('temperature').isFloat().withMessage('Temperature must be a number'),
        body('x_acceleration').isFloat().withMessage('x_acceleration must be a number'),
        body('y_acceleration').isFloat().withMessage('y_acceleration must be a number'),
        body('z_acceleration').isFloat().withMessage('z_acceleration must be a number'),
        body('x_gyro').isFloat().withMessage('x_gyro must be a number'),
        body('y_gyro').isFloat().withMessage('y_gyro must be a number'),
        body('z_gyro').isFloat().withMessage('z_gyro must be a number'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const {
            temperature,
            x_acceleration,
            y_acceleration,
            z_acceleration,
            x_gyro,
            y_gyro,
            z_gyro,
        } = req.body;

        try {
            const query = `
                INSERT INTO motion_data (
                    temperature, x_acceleration, y_acceleration, z_acceleration, 
                    x_gyro, y_gyro, z_gyro
                ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
            const values = [
                temperature,
                x_acceleration,
                y_acceleration,
                z_acceleration,
                x_gyro,
                y_gyro,
                z_gyro,
            ];

            const result = await pool.query(query, values);

            res.status(201).json({
                success: true,
                message: 'Data inserted successfully',
                data: result.rows[0],
            });
        } catch (err) {
            next(err);
        }
    }
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(err.message || 'Something went wrong!');
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
