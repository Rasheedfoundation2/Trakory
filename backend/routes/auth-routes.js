// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');
const { sendPasswordResetEmail } = require('../utils/email-service');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                throw err;
            }
            
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
                        if (err) {
                            throw err;
                        }
                        
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
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }


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
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

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

// One-shot admin setup endpoint. Useful when there is no shell on the host.
// Creates a new admin or promotes / resets the password of an existing user.
// Protected by SETUP_TOKEN env var — set it on the host before calling, and
// remove or rotate it afterwards.
//
//   curl -X POST https://<backend>/setup-admin \
//        -H "Content-Type: application/json" \
//        -d '{"token":"<SETUP_TOKEN>","email":"you@x.com","password":"...","name":"You"}'
router.post('/setup-admin', async (req, res) => {
    const expected = process.env.SETUP_TOKEN;
    if (!expected) {
        return res.status(503).json({ error: 'SETUP_TOKEN is not configured on the server' });
    }

    const { token, email, password, name } = req.body || {};
    if (!token || token !== expected) {
        return res.status(403).json({ error: 'Invalid setup token' });
    }
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        const safeName = (name || String(email).split('@')[0]).trim();

        db.query('SELECT id FROM users WHERE email = ?', [email], (err, rows) => {
            if (err) {
                console.error('setup-admin lookup error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (rows.length) {
                db.query(
                    'UPDATE users SET password = ?, is_admin = 1, name = ? WHERE email = ?',
                    [hashed, safeName, email],
                    (err) => {
                        if (err) {
                            console.error('setup-admin update error:', err);
                            return res.status(500).json({ error: 'Failed to update user' });
                        }
                        res.json({ ok: true, action: 'promoted', email });
                    }
                );
            } else {
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
                    [safeName, email, hashed],
                    (err, result) => {
                        if (err) {
                            console.error('setup-admin insert error:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }
                        res.json({ ok: true, action: 'created', email, id: result.insertId });
                    }
                );
            }
        });
    } catch (e) {
        console.error('setup-admin unexpected error:', e);
        res.status(500).json({ error: 'Unexpected error' });
    }
});

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        db.query('SELECT id, name, email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                // Don't reveal if email exists or not for security
                return res.json({ 
                    message: 'If an account with that email exists, a password reset link has been sent.' 
                });
            }

            const user = results[0];
            
            // Generate secure random token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

            // Store reset token in database
            db.query(
                'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
                [email, resetToken, expiresAt],
                async (err, result) => {
                    if (err) {
                        console.error('Error storing reset token:', err);
                        return res.status(500).json({ error: 'Failed to process request' });
                    }

                    // Send reset email
                    const emailResult = await sendPasswordResetEmail(email, resetToken, user.name);
                    
                    if (emailResult.success) {
                        res.json({ 
                            message: 'If an account with that email exists, a password reset link has been sent.',
                            debug: process.env.NODE_ENV === 'development' ? { token: resetToken } : undefined
                        });
                    } else {
                        console.error('Email sending failed:', emailResult.error);
                        res.status(500).json({ error: 'Failed to send reset email' });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset Password - Verify token and update password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        // Find valid reset token
        db.query(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token],
            async (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (results.length === 0) {
                    return res.status(400).json({ error: 'Invalid or expired reset token' });
                }

                const { email } = results[0];

                // Hash new password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Update user password
                db.query(
                    'UPDATE users SET password = ? WHERE email = ?',
                    [hashedPassword, email],
                    (err, updateResult) => {
                        if (err) {
                            console.error('Error updating password:', err);
                            return res.status(500).json({ error: 'Failed to update password' });
                        }

                        if (updateResult.affectedRows === 0) {
                            return res.status(404).json({ error: 'User not found' });
                        }

                        // Mark token as used
                        db.query(
                            'UPDATE password_resets SET used = TRUE WHERE token = ?',
                            [token],
                            (err) => {
                                if (err) {
                                    console.error('Error marking token as used:', err);
                                }
                            }
                        );

                        res.json({ message: 'Password has been reset successfully' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify Reset Token - Check if token is valid (optional route for frontend validation)
router.get('/verify-reset-token/:token', (req, res) => {
    const { token } = req.params;

    db.query(
        'SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = FALSE',
        [token],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(400).json({ 
                    valid: false, 
                    error: 'Invalid or expired reset token' 
                });
            }

            res.json({ 
                valid: true, 
                email: results[0].email 
            });
        }
    );
});

module.exports = router;