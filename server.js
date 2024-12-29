const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Pool } = require('pg');  // Import PostgreSQL Pool
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize PostgreSQL Database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database.');
});

// Register
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    pool.query(
        `INSERT INTO users (email, password) VALUES ($1, $2)`,
        [email, password],
        (err, result) => {
            if (err) return res.status(400).json({ error: 'User already exists.' });
            res.json({ message: 'Registration successful.' });
        }
    );
});

// Sell
app.post('/sell', (req, res) => {
    const { userId, currency, amount } = req.body;
    console.log('Request body:', req.body); // Log the request body

    pool.query(
        `SELECT amount FROM holdings WHERE userId = $1 AND currency = $2`,
        [userId, currency],
        (err, result) => {
            if (err || result.rows.length === 0 || result.rows[0].amount < amount) {
                return res.status(400).json({ error: 'Not enough currency to sell.' });
            }

            const value = amount * getExchangeRate(currency); // Calculate based on rates
            pool.query(
                `UPDATE holdings SET amount = amount - $1 WHERE userId = $2 AND currency = $3`,
                [amount, userId, currency]
            );
            pool.query(
                `UPDATE users SET balance = balance + $1 WHERE id = $2`,
                [value, userId]
            );
            pool.query(
                `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
                 VALUES ($1, $2, $3, 'sell', $4)`,
                [userId, currency, amount, new Date().toISOString()]
            );
            res.json({ message: 'Currency sold successfully.' });
        }
    );
    console.log('userId:', userId, 'currency:', currency, 'amount:', amount);
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    pool.query(
        `SELECT id, balance FROM users WHERE email = $1 AND password = $2`,
        [email, password],
        (err, result) => {
            if (err || result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
            res.json({ userId: result.rows[0].id, balance: result.rows[0].balance });
        }
    );
});

// Fund account
app.post('/fund', (req, res) => {
    const { userId, amount } = req.body;
    pool.query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [amount, userId],
        (err) => {
            if (err) return res.status(400).json({ error: 'Error funding account.' });
            res.json({ message: 'Account funded successfully.' });
        }
    );
});

// Buy
app.post('/buy', (req, res) => {
    const { userId, currency, amount, cost } = req.body;

    pool.query(`SELECT balance FROM users WHERE id = $1`, [userId], (err, result) => {
        if (err || result.rows.length === 0 || result.rows[0].balance < cost) {
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        pool.query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [cost, userId]);
        pool.query(
            `INSERT INTO holdings (userId, currency, amount) 
             VALUES ($1, $2, $3) 
             ON CONFLICT(userId, currency) 
             DO UPDATE SET amount = amount + excluded.amount`,
            [userId, currency, amount]
        );
        pool.query(
            `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
            VALUES ($1, $2, $3, 'buy', $4)`,
            [userId, currency, amount, new Date().toISOString()]
        );
        res.json({ message: 'Currency purchased successfully.' });
    });
});

// Get exchange rates (NBP API)
app.get('/rates', async (req, res) => {
    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        res.json(response.data[0].rates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exchange rates.' });
    }
});

// Archived rates and transactions
app.get('/archived/:userId', (req, res) => {
    const { userId } = req.params;

    pool.query(
        `SELECT * FROM transactions WHERE userId = $1 ORDER BY timestamp DESC`,
        [userId],
        (err, result) => {
            if (err) return res.status(400).json({ error: 'Failed to fetch transactions.' });
            res.json(result.rows);
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Helper function to calculate exchange rates (Mock implementation)
function getExchangeRate(currency) {
    return 4.5; // Example fixed rate
}
