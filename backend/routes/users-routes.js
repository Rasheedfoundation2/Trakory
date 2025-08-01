

// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');

// router.get('/users/names', async (req, res) => {
//     try {
//         const query = 'SELECT name FROM users ORDER BY name ASC';
//         db.query(query, (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ error: 'Database error' });
//             }
//             const names = results.map(user => user.name);
//             res.json(names);
//         });
//     } catch (error) {
//         console.error('Server error:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// module.exports = router;


// routes/user-routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

router.get('/users/names', (req, res) => {
    db.query('SELECT name FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results.map(user => user.name));
    });
});

// Get all users (admin only)
// Fix the SQL query to properly select fields
router.get('/users', authenticateToken, (req, res) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    db.query(
      'SELECT id, name, email, CAST(is_admin AS UNSIGNED) AS is_admin, created_at FROM users',
        (err, results) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Backend users data:', results);
            res.json(results);
        }
    );
});

// Update user information (admin only)
// Update user information (admin only)
router.put('/users/:id', authenticateToken, (req, res) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, email, is_admin } = req.body;

    // Add proper validation
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    db.query(
        'UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?',
        [name, email, is_admin, id],
        (err, result) => {
            if (err) {
                console.error('Error updating user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User updated successfully' });
        }
    );
});
// Delete user (admin only)
router.delete('/users/:id', authenticateToken, (req, res) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Prevent deleting the primary admin (user with ID 1)
    if (id == 1) {
        return res.status(400).json({ error: 'Cannot delete primary admin' });
    }

    // Prevent users from deleting themselves
    if (id == req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.query(
        'DELETE FROM users WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        }
    );
});

// Update admin status (admin only)
router.patch('/users/:id/admin-status', authenticateToken, (req, res) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { is_admin } = req.body;

    // Prevent changing the primary admin's status
    if (id == 1) {
        return res.status(400).json({ error: 'Cannot change primary admin status' });
    }

    // Prevent users from changing their own status
    if (id == req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    db.query(
        'UPDATE users SET is_admin = ? WHERE id = ?',
        [is_admin, id],
        (err, result) => {
            if (err) {
                console.error('Error updating admin status:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'Admin status updated successfully' });
        }
    );
});

module.exports = router;