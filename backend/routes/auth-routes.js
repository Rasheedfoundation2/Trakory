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

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Database error checking email:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.query('SELECT COUNT(*) as count FROM users', (err, countResults) => {
                if (err) {
                    console.error('Database error counting users:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                const is_admin = countResults[0].count === 0;
                const role = is_admin ? 'admin' : 'user';
                
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                    [name, email, hashedPassword, is_admin],
                    (err, result) => {
                        if (err) {
                            console.error('Database error inserting user:', err);
                            return res.status(500).json({ error: 'Database error' });
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

// Setup admin user (for hosts without shell access)
router.post('/setup-admin', async (req, res) => {
    const { setupToken, name, email, password } = req.body;
    
    // Protect this endpoint with a strong secret token stored in env
    const expectedToken = process.env.SETUP_ADMIN_TOKEN;
    if (!expectedToken || setupToken !== expectedToken) {
        return res.status(403).json({ error: 'Forbidden: Invalid setup token' });
    }

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const hashedPassword = await bcrypt.hash(password, 10);

            if (results.length > 0) {
                // Update to admin
                db.query(
                    'UPDATE users SET password = ?, is_admin = 1 WHERE email = ?',
                    [hashedPassword, email],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Update error' });
                        res.json({ message: 'User updated to admin successfully' });
                    }
                );
            } else {
                // Insert new admin
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
                    [name, email, hashedPassword],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Insert error' });
                        res.status(201).json({ message: 'Admin user created successfully' });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Setup admin error:', error);
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