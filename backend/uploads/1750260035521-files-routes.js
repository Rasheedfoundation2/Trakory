// routes/files.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

// Get all folders
router.get('/folders', authenticateToken, (req, res) => {
    db.query(
        'SELECT * FROM folders WHERE user_id = ?',
        [req.user.id],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch folders' });
            }
            res.json(results);
        }
    );
});

// Create new folder/file
router.post('/folders', authenticateToken, (req, res) => {
    const { name, type, itemType, category } = req.body;
    
    if (!name || !type || !itemType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.query(
        'INSERT INTO folders (name, type, user_id, item_type, category) VALUES (?, ?, ?, ?, ?)',
        [name, type, req.user.id, itemType, category || null],
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create item' });
            }
            
            res.status(201).json({
                id: result.insertId,
                name,
                type,
                itemType,
                category,
                userId: req.user.id,
                createdAt: new Date().toISOString(),
                dateChanged: new Date().toISOString()
            });
        }
    );
});

// Delete folder/file (move to recycle bin)
router.delete('/folders/:id', authenticateToken, (req, res) => {
    db.query(
        'SELECT * FROM folders WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'Item not found' });

            const item = results[0];
            
            // Move to recycle bin
            db.query(
                'INSERT INTO recycle_bin_items (name, original_path, user_id, folder_id, size) VALUES (?, ?, ?, ?, ?)',
                [item.name, item.type, req.user.id, item.id, item.size || '0 KB'],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Failed to move to recycle bin' });

                    // Delete original
                    db.query(
                        'DELETE FROM folders WHERE id = ?',
                        [req.params.id],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database error' });
                            res.json({ message: 'Item moved to recycle bin' });
                        }
                    );
                }
            );
        }
    );
});

// Get recycle bin items
router.get('/recycle-bin', authenticateToken, (req, res) => {
    db.query(
        'SELECT * FROM recycle_bin_items WHERE user_id = ?',
        [req.user.id],
        (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch recycle bin' });
            }
            res.json(results);
        }
    );
});

// Empty recycle bin
router.delete('/recycle-bin', authenticateToken, (req, res) => {
    db.query(
        'DELETE FROM recycle_bin_items WHERE user_id = ?',
        [req.user.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Recycle bin emptied' });
        }
    );
});

// Restore from recycle bin
router.post('/recycle-bin/restore/:id', authenticateToken, (req, res) => {
    db.query(
        'SELECT * FROM recycle_bin_items WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(404).json({ error: 'Item not found' });

            const item = results[0];
            
            // Restore to original location
            db.query(
                'INSERT INTO folders (name, type, user_id, item_type) VALUES (?, ?, ?, "file")',
                [item.name, item.original_path, req.user.id],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Failed to restore item' });

                    // Delete from recycle bin
                    db.query(
                        'DELETE FROM recycle_bin_items WHERE id = ?',
                        [req.params.id],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database error' });
                            res.json({ message: 'Item restored successfully' });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;