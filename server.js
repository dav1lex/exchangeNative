const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Pool } = require('pg');  // Import PostgreSQL
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
// login
app.post('/login', (req, res) => {
    const {email, password} = req.body;
    pool.query(
        `SELECT id, balance FROM users WHERE email = $1 AND password = $2`,
        [email, password],
        (err, result) => {
            if (err || result.rows.length === 0) return res.status(401).json({error: 'Invalid credentials.'});
            res.json({userId: result.rows[0].id, balance: parseFloat(result.rows[0].balance)});
        }
    );
});

// Register
app.post('/register', (req, res) => {
    const {email, password} = req.body;
    pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (result.rows.length > 0) return res.status(400).json({ error: 'User already exists.' });

            // If email does not exist, insert new user
            pool.query(
                `INSERT INTO users (email, password) VALUES ($1, $2)`,
                [email, password],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error.' });
                    res.json({ message: 'Registration successful.' });
                }
            );
        }
    );
});

// Sell
app.post('/sell', async (req, res) => {
    const {userId, currency, amount} = req.body;
    const numericAmount = parseFloat(amount); // Ensure 'amount' is a number

    console.log(`Received sell request: userId=${userId}, currency=${currency}, amount=${numericAmount}`);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({error: 'Invalid amount.'});
    }

    try {
        // Fetch exchange rates from NBP API
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        const rates = response.data[0].rates;
        const rate = rates.find(rate => rate.code === currency);

        if (!rate) {
            return res.status(400).json({error: 'Currency not supported.'});
        }

        console.log(`Fetched rate for ${currency}: mid=${rate.mid}`);

        const sellRate = rate.mid; // Using mid as the rate for selling as well
        const value = numericAmount * sellRate;

        // Check if user has enough currency to sell
        const holdingResult = await pool.query(`SELECT amount FROM holdings WHERE userId = $1 AND currency = $2`, [userId, currency]);
        if (holdingResult.rows.length === 0) {
            return res.status(400).json({error: 'Not enough currency to sell.'});
        }

        const holdingAmount = parseFloat(holdingResult.rows[0].amount);
        console.log(`Holding amount: holdingAmount=${holdingAmount}`);

        if (isNaN(holdingAmount) || holdingAmount < numericAmount) {
            return res.status(400).json({error: 'Not enough currency to sell.'});
        }

        // Update holdings
        if (holdingAmount === numericAmount) {
            // If all currency is sold, remove the entry
            await pool.query(`DELETE FROM holdings WHERE userId = $1 AND currency = $2`, [userId, currency]);
        } else {
            await pool.query(`UPDATE holdings SET amount = amount - $1 WHERE userId = $2 AND currency = $3`, [numericAmount, userId, currency]);
        }

        // Update user balance
        const userResult = await pool.query(`SELECT balance FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'User not found.' });
        }

        const userBalance = parseFloat(userResult.rows[0].balance);
        console.log(`User balance before sale: balance=${userBalance}`);

        if (isNaN(userBalance)) {
            return res.status(400).json({ error: 'Invalid user balance.' });
        }

        const newBalance = userBalance + value;
        console.log(`New balance after sale: newBalance=${newBalance}`);
        await pool.query(`UPDATE users SET balance = $1 WHERE id = $2`, [newBalance, userId]);

        // Record transaction
        await pool.query(
            `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
             VALUES ($1, $2, $3, 'sell', $4)`,
            [userId, currency, numericAmount, new Date().toISOString()]
        );

        res.json({ message: 'Currency sold successfully.', newBalance: newBalance });
    } catch (error) {
        console.error('Error selling currency:', error);
        res.status(500).json({ error: 'Error selling currency.' });
    }
});

// Buy
app.post('/buy', async (req, res) => {
    const { userId, currency, amount } = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount.' });
    }

    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        const rates = response.data[0].rates;
        const rate = rates.find(rate => rate.code === currency);

        if (!rate) {
            return res.status(400).json({ error: 'Currency not supported.' });
        }

        const cost = numericAmount * rate.mid; // Using mid rate for cost calculation

        const userResult = await pool.query(`SELECT balance FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'User not found.' });
        }

        const userBalance = parseFloat(userResult.rows[0].balance);
        if (isNaN(userBalance) || userBalance < cost) {
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        const newBalance = userBalance - cost;
        await pool.query(`UPDATE users SET balance = $1 WHERE id = $2`, [newBalance, userId]);
        await pool.query(
            `INSERT INTO holdings (userId, currency, amount) 
             VALUES ($1, $2, $3) 
             ON CONFLICT(userId, currency) 
             DO UPDATE SET amount = holdings.amount + excluded.amount`,
            [userId, currency, numericAmount]
        );
        await pool.query(
            `INSERT INTO transactions (userId, currency, amount, type, timestamp) 
             VALUES ($1, $2, $3, 'buy', $4)`,
            [userId, currency, numericAmount, new Date().toISOString()]
        );

        res.json({ message: 'Currency purchased successfully.', balance: newBalance });
    } catch (error) {
        console.error('Error buying currency:', error);
        res.status(500).json({ error: 'Error purchasing currency.' });
    }
});

// Fund account
app.post('/fund', (req, res) => {
    const { userId, amount } = req.body;
    const numericAmount = parseFloat(amount); // Ensure 'amount' is a number
    if (isNaN(numericAmount)) {
        return res.status(400).json({ error: 'Invalid amount.' });
    }

    pool.query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [numericAmount, userId],
        (err) => {
            if (err) return res.status(400).json({ error: 'Error funding account.' });

            // After updating the balance, retrieve the updated balance
            pool.query(
                `SELECT balance FROM users WHERE id = $1`,
                [userId],
                (err, result) => {
                    if (err || result.rows.length === 0) {
                        return res.status(400).json({ error: 'Error retrieving updated balance.' });
                    }
                    const updatedBalance = parseFloat(result.rows[0].balance);
                    console.log(`Updated balance for user ${userId}: ${updatedBalance}`); // Log the updated balance
                    res.json({ message: 'Account funded successfully.', balance: updatedBalance });
                }
            );
        }
    );
});

// Get rates (NBP API)
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

// Get holdings
app.get('/holdings/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const holdingsResult = await pool.query(`SELECT currency, amount FROM holdings WHERE userId = $1`, [userId]);
        console.log(`Holdings for user ${userId}:`, holdingsResult.rows); // Log the holdings data
        res.json(holdingsResult.rows);
    } catch (error) {
        console.error('Error fetching holdings:', error);
        res.status(500).json({ error: 'Error fetching holdings.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});