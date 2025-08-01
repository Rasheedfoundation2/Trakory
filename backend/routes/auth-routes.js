// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) throw err;
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.query('SELECT COUNT(*) as count FROM users', (err, countResults) => {
                const is_admin = countResults[0].count === 0;
                 const role = is_admin ? 'admin' : 'user'; // changed line
                
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                    [name, email, hashedPassword, is_admin],
                    (err, result) => {
                        if (err) throw err;
                        
                        const token = jwt.sign(
                            { id: result.insertId, email, is_admin },
                            SECRET_KEY,
                            { expiresIn: '24h' }
                        );
                        
                        res.status(201).json({
                            message: 'User registered successfully',
                            token,
                            user: {
                                id: result.insertId,
                                name,
                                email,
                                is_admin
                            }
                        });
                    }
                );
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });


        const role = user.is_admin ? 'admin' : 'user';  //changed line 
        const token = jwt.sign(
            { id: user.id, email: user.email, is_admin: user.is_admin },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_admin: user.is_admin
            }
        });
    });
});


// Get user info
router.get('/user-info', authenticateToken, (req, res) => {
    db.query(
        'SELECT id, name, email, is_admin FROM users WHERE id = ?',
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'User not found' });

               const role = results[0].is_admin ? 'admin' : 'user'; //changes line

            res.json({
                id: results[0].id,
                name: results[0].name,
                email: results[0].email,
                is_admin: results[0].is_admin
            });
        }
    );
});

module.exports = router;