const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

// GET all project tasks
router.get('/', authenticateToken, (req, res) => {
    const { status } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = `
        SELECT 
            p.id, p.name, p.start_date AS startDate, p.end_date AS endDate,
            p.created_at AS createdAt, p.updated_at AS updatedAt,
            p.is_deleted AS isDeleted, p.deleted_at AS deletedAt,
            u.name AS userName, u.email AS userEmail
        FROM project_task p
        JOIN users u ON p.user_id = u.id
    `;

    const conditions = [];
    const params = [];

    if (status === 'active') conditions.push('p.is_deleted = 0');
    else if (status === 'deleted') conditions.push('p.is_deleted = 1');

    if (!isAdmin) {
        conditions.push('p.user_id = ?');
        params.push(userId);
    }

    if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error(' Query error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        const formatted = results.map(project => ({
            ...project,
            startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
            endDate: project.endDate ? new Date(project.endDate).toISOString() : null,
            createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : null,
            updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : null,
            deletedAt: project.deletedAt ? new Date(project.deletedAt).toISOString() : null
        }));

        res.json({ success: true, data: formatted });
    });
});

// POST a new project task
router.post('/', authenticateToken, (req, res) => {
    const { name, startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ error: 'End date must be after start date' });
    }

    const query = `
        INSERT INTO project_task (user_id, name, start_date, end_date)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [userId, name, startDate, endDate], (err, result) => {
        if (err) {
            console.error(' Insert error:', err);
            return res.status(500).json({ error: 'Insert failed', details: err.message });
        }

        res.json({
            success: true,
            message: 'Project task created successfully',
            data: {
                id: result.insertId,
                name,
                startDate,
                endDate,
                createdAt: new Date().toISOString(),
                isDeleted: false,
                userName: req.user.name,
                userEmail: req.user.email
            }
        });
    });
});

// PUT update a project task
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ error: 'End date must be after start date' });
    }

    let query = `
        UPDATE project_task 
        SET name = ?, start_date = ?, end_date = ?, updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
    `;
    let params = [name, startDate, endDate, id];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error(' Update error:', err);
            return res.status(500).json({ error: 'Update failed', details: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project task not found or not authorized' });
        }

        res.json({ success: true, message: 'Project task updated successfully' });
    });
});

// PUT move to recycle bin (soft delete)
router.put('/:id/delete', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = `
        UPDATE project_task 
        SET is_deleted = 1, deleted_at = NOW() 
        WHERE id = ? AND is_deleted = 0
    `;
    let params = [id];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error(' Soft delete error:', err);
            return res.status(500).json({ error: 'Soft delete failed', details: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project task not found or already deleted' });
        }

        res.json({ success: true, message: 'Project task moved to recycle bin' });
    });
});

// PUT restore from recycle bin
router.put('/:id/restore', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = `
        UPDATE project_task 
        SET is_deleted = 0, updated_at = NOW() 
        WHERE id = ? AND is_deleted = 1
    `;
    let params = [id];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error(' Restore error:', err);
            return res.status(500).json({ error: 'Restore failed', details: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project task not found in recycle bin or not authorized' });
        }

        res.json({ success: true, message: 'Project task restored successfully' });
    });
});

// DELETE permanently from recycle bin
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query = 'DELETE FROM project_task WHERE id = ? AND is_deleted = 1';
    let params = [id];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error(' Delete error:', err);
            return res.status(500).json({ error: 'Delete failed', details: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project task not found or not in recycle bin' });
        }

        res.json({ success: true, message: 'Project task permanently deleted' });
    });
});

module.exports = router;