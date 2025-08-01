const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

// Get all users (admin only)
router.get('/', authenticateToken, (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  db.query(
    'SELECT id, name, email, CAST(is_admin AS UNSIGNED) AS is_admin, created_at FROM users ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      res.json({ 
        success: true,
        data: results 
      });
    }
  );
});

// Update admin status
router.patch('/:id/admin-status', authenticateToken, (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  const { id } = req.params;
  const { is_admin } = req.body;

  // Prevent changing primary admin status
  if (id == 1) {
    return res.status(400).json({ 
      success: false,
      error: 'Cannot change primary admin status' 
    });
  }

  // Prevent self-modification
  if (id == req.user.id) {
    return res.status(400).json({ 
      success: false,
      error: 'Cannot change your own admin status' 
    });
  }

  db.query(
    'UPDATE users SET is_admin = ? WHERE id = ?',
    [is_admin, id],
    (err, result) => {
      if (err) {
        console.error('Error updating admin status:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }
      res.json({ 
        success: true,
        message: 'Admin status updated successfully' 
      });
    }
  );
});

// Delete user
router.delete('/:id', authenticateToken, (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  const { id } = req.params;

  // Prevent deleting primary admin
  if (id == 1) {
    return res.status(400).json({ 
      success: false,
      error: 'Cannot delete primary admin' 
    });
  }

  // Prevent self-deletion
  if (id == req.user.id) {
    return res.status(400).json({ 
      success: false,
      error: 'Cannot delete your own account' 
    });
  }

  db.query(
    'DELETE FROM users WHERE id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }
      res.json({ 
        success: true,
        message: 'User deleted successfully' 
      });
    }
  );
});

module.exports = router;