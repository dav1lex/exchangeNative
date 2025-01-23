const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

pool.on('connect', () => {
    console.log('Connected to the database.');
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            message: 'Database connected successfully',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.post('/login', (req, res) => {
    const {email, password} = req.body;

    if (!emailRegex.test(email)) {
        return res.status(400).json({error: 'Invalid email format.'});
    }

    pool.query(
        `SELECT id, balance FROM users WHERE email = $1 AND password = $2`,
        [email, password],
        (err, result) => {
            if (err || result.rows.length === 0) return res.status(401).json({error: 'Invalid credentials.'});
            res.json({userId: result.rows[0].id, balance: parseFloat(result.rows[0].balance)});
        }
    );
});

app.post('/register', (req, res) => {
    console.log('Register endpoint hit, body:', req.body);
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    console.log('Received registration request:', { email });

    if (!emailRegex.test(email)) {
        console.log('Invalid email format:', email);
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email],
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({error: 'Database error.'});
            }
            if (result.rows.length > 0) {
                console.log('User already exists:', email);
                return res.status(400).json({error: 'User already exists.'});
            }

            pool.query(
                `INSERT INTO users (email, password) VALUES ($1, $2)`,
                [email, password],
                (err, result) => {
                    if (err) {
                        console.error('Insert error:', err);
                        return res.status(500).json({error: 'Database error.'});
                    }
                    console.log('Registration successful:', email);
                    res.json({message: 'Registration successful.'});
                }
            );
        }
    );
});

app.post('/sell', async (req, res) => {
    const {userId, currency, amount} = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({error: 'Invalid amount.'});
    }

    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        const rates = response.data[0].rates;
        const rate = rates.find(rate => rate.code === currency);

        if (!rate) {
            return res.status(400).json({error: 'Currency not supported.'});
        }

        const sellRate = rate.mid;
        const value = numericAmount * sellRate;

        const holdingResult = await pool.query(
            `SELECT amount FROM holdings WHERE userId = $1 AND currency = $2`,
            [userId, currency]
        );

        if (holdingResult.rows.length === 0) {
            return res.status(400).json({error: 'Not enough currency to sell.'});
        }

        const holdingAmount = parseFloat(holdingResult.rows[0].amount);
        if (isNaN(holdingAmount) || holdingAmount < numericAmount) {
            return res.status(400).json({error: 'Not enough currency to sell.'});
        }

        // Begin transaction
        await pool.query('BEGIN');

        try {
            if (holdingAmount === numericAmount) {
                await pool.query(
                    `DELETE FROM holdings WHERE userId = $1 AND currency = $2`,
                    [userId, currency]
                );
            } else {
                await pool.query(
                    `UPDATE holdings SET amount = amount - $1 WHERE userId = $2 AND currency = $3`,
                    [numericAmount, userId, currency]
                );
            }

            const userResult = await pool.query(
                `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
                [value, userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found.');
            }

            await pool.query(
                `INSERT INTO transactions (userId, currency, amount, type, timestamp, rate) 
                 VALUES ($1, $2, $3, 'sell', $4, $5)`,
                [userId, currency, numericAmount, new Date().toISOString(), sellRate]
            );

            await pool.query('COMMIT');

            res.json({
                message: 'Currency sold successfully.',
                newBalance: parseFloat(userResult.rows[0].balance)
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error selling currency:', error);
        res.status(500).json({error: 'Error selling currency.'});
    }
});

app.post('/buy', async (req, res) => {
    const {userId, currency, amount} = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({error: 'Invalid amount.'});
    }

    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        const rates = response.data[0].rates;
        const rate = rates.find(rate => rate.code === currency);

        if (!rate) {
            return res.status(400).json({error: 'Currency not supported.'});
        }

        const cost = numericAmount * rate.mid;

        // Begin transaction
        await pool.query('BEGIN');

        try {
            const userResult = await pool.query(
                `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
                [cost, userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('Insufficient balance or user not found.');
            }

            await pool.query(
                `INSERT INTO holdings (userId, currency, amount) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT(userId, currency) 
                 DO UPDATE SET amount = holdings.amount + excluded.amount`,
                [userId, currency, numericAmount]
            );

            await pool.query(
                `INSERT INTO transactions (userId, currency, amount, type, timestamp, rate) 
                 VALUES ($1, $2, $3, 'buy', $4, $5)`,
                [userId, currency, numericAmount, new Date().toISOString(), rate.mid]
            );

            await pool.query('COMMIT');

            res.json({
                message: 'Currency purchased successfully.',
                balance: parseFloat(userResult.rows[0].balance)
            });
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error buying currency:', error);
        res.status(500).json({error: 'Error purchasing currency.'});
    }
});

app.post('/fund', async (req, res) => {
    const {userId, amount} = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({error: 'Invalid amount.'});
    }

    try {
        const result = await pool.query(
            `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
            [numericAmount, userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({error: 'User not found.'});
        }

        const updatedBalance = parseFloat(result.rows[0].balance);
        res.json({message: 'Account funded successfully.', balance: updatedBalance});
    } catch (error) {
        console.error('Error funding account:', error);
        res.status(500).json({error: 'Error funding account.'});
    }
});

app.get('/rates', async (req, res) => {
    try {
        const response = await axios.get('https://api.nbp.pl/api/exchangerates/tables/A?format=json');
        res.json(response.data[0].rates);
    } catch (error) {
        console.error('Error fetching rates:', error);
        res.status(500).json({error: 'Failed to fetch exchange rates.'});
    }
});

app.get('/archived/:userId', async (req, res) => {
    const {userId} = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM transactions WHERE userId = $1 ORDER BY timestamp DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(400).json({error: 'Failed to fetch transactions.'});
    }
});

app.get('/holdings/:userId', async (req, res) => {
    const {userId} = req.params;

    try {
        const holdingsResult = await pool.query(
            `SELECT currency, amount FROM holdings WHERE userId = $1`,
            [userId]
        );
        res.json(holdingsResult.rows);
    } catch (error) {
        console.error('Error fetching holdings:', error);
        res.status(500).json({error: 'Error fetching holdings.'});
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Something went wrong!'});
});

// 404
app.use((req, res) => {
    res.status(404).json({error: 'Endpoint not found'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});