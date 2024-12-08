const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const db = process.env.DATABASE_URL || require('./backend/database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register endpoint
app.post('/register', (req, res) => {
    const {email, password} = req.body;
    db.run(
        `INSERT INTO users (email, password) VALUES (?, ?)`,
        [email, password],
        (err) => {
            if (err) return res.status(400).json({error: 'User already exists.'});
            res.json({message: 'Registration successful.'});
        }
    );
});

//sell
app.post('/sell', (req, res) => {
    const { userId, currency, amount } = req.body;
    console.log('Request body:', req.body);  // Log the request body

    db.get(
        `SELECT amount FROM holdings WHERE userId = ? AND currency = ?`,
        [userId, currency],
        (err, row) => {
            if (err || !row || row.amount < amount) {
                return res.status(400).json({ error: 'Not enough currency to sell.' });
            }

            const value = amount * getExchangeRate(currency); // Calculate based on rates
            db.run(
                `UPDATE holdings SET amount = amount - ? WHERE userId = ? AND currency = ?`,
                [amount, userId, currency]
            );
            db.run(
                `UPDATE users SET balance = balance + ? WHERE id = ?`,
                [value, userId]
            );
            db.run(
                `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
         VALUES (?, ?, ?, 'sell', ?)`,
                [userId, currency, amount, new Date().toISOString()]
            );
            res.json({ message: 'Currency sold successfully.' });
        }

    );
    console.log('userId:', userId, 'currency:', currency, 'amount:', amount);

});
// Login endpoint
app.post('/login', (req, res) => {
    const {email, password} = req.body;
    db.get(
        `SELECT id, balance FROM users WHERE email = ? AND password = ?`,
        [email, password],
        (err, row) => {
            if (err || !row) return res.status(401).json({error: 'Invalid credentials.'});
            res.json({userId: row.id, balance: row.balance});
        }
    );
});

// Fund account endpoint
app.post('/fund', (req, res) => {
    const {userId, amount} = req.body;
    db.run(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [amount, userId],
        (err) => {
            if (err) return res.status(400).json({error: 'Error funding account.'});
            res.json({message: 'Account funded successfully.'});
        }
    );
});

// Buy currency endpoint
app.post('/buy', (req, res) => {
    const {userId, currency, amount, cost} = req.body;

    db.get(`SELECT balance FROM users WHERE id = ?`, [userId], (err, row) => {
        if (err || !row || row.balance < cost) {
            return res.status(400).json({error: 'Insufficient balance.'});
        }

        db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [cost, userId]);
        db.run(
            `INSERT INTO holdings (userId, currency, amount) 
             VALUES (?, ?, ?) 
             ON CONFLICT(userId, currency) 
             DO UPDATE SET amount = amount + excluded.amount`,
            [userId, currency, amount]
        );
        db.run(
            `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
            VALUES (?, ?, ?, 'buy', ?)`,
            [userId, currency, amount, new Date().toISOString()]
        );
        res.json({message: 'Currency purchased successfully.'});
    });
});

// Get exchange rates (NBP API)
app.get('/rates', async (req, res) => {
    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        res.json(response.data[0].rates);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch exchange rates.'});
    }
});

// Archived rates and transactions
app.get('/archived/:userId', (req, res) => {
    const {userId} = req.params;

    db.all(
        `SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC`,
        [userId],
        (err, rows) => {
            if (err) return res.status(400).json({error: 'Failed to fetch transactions.'});
            res.json(rows);
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
