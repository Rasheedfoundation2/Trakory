// Monday-style task management tool routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

const VALID_STATUSES = ['not_started', 'working_on_it', 'stuck', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });

// ----- Boards -----

router.get('/boards', authenticateToken, async (req, res) => {
    try {
        const rows = await query(
            `SELECT b.id, b.name, b.description, b.owner_id AS ownerId,
                    u.name AS ownerName, b.is_archived AS isArchived,
                    b.created_at AS createdAt, b.updated_at AS updatedAt,
                    (SELECT COUNT(*) FROM task_board_items i WHERE i.board_id = b.id) AS itemCount
             FROM task_boards b
             LEFT JOIN users u ON b.owner_id = u.id
             WHERE b.is_archived = 0
             ORDER BY b.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Boards fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

router.post('/boards', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Board name is required' });

    try {
        const result = await query(
            'INSERT INTO task_boards (name, description, owner_id) VALUES (?, ?, ?)',
            [name.trim(), description || null, req.user.id]
        );
        const boardId = result.insertId;

        // Seed default groups so the board is usable immediately
        const defaultGroups = [
            { name: 'To Do', color: '#0073ea', position: 0 },
            { name: 'In Progress', color: '#fdab3d', position: 1 },
            { name: 'Done', color: '#00c875', position: 2 },
        ];
        for (const g of defaultGroups) {
            await query(
                'INSERT INTO task_board_groups (board_id, name, color, position) VALUES (?, ?, ?, ?)',
                [boardId, g.name, g.color, g.position]
            );
        }

        res.status(201).json({ success: true, data: { id: boardId, name: name.trim(), description: description || null } });
    } catch (err) {
        console.error('Board create error:', err);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

router.put('/boards/:id', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        await query('UPDATE task_boards SET name = ?, description = ? WHERE id = ?', [
            name,
            description || null,
            req.params.id,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error('Board update error:', err);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

router.delete('/boards/:id', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM task_boards WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Board delete error:', err);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});

// Full board: groups + items in one payload (Monday-style table view)
router.get('/boards/:id/full', authenticateToken, async (req, res) => {
    const boardId = req.params.id;
    try {
        const boards = await query(
            `SELECT b.id, b.name, b.description, b.owner_id AS ownerId, u.name AS ownerName
             FROM task_boards b LEFT JOIN users u ON b.owner_id = u.id
             WHERE b.id = ?`,
            [boardId]
        );
        if (!boards.length) return res.status(404).json({ error: 'Board not found' });

        const groups = await query(
            'SELECT id, name, color, position FROM task_board_groups WHERE board_id = ? ORDER BY position, id',
            [boardId]
        );

        const items = await query(
            `SELECT i.id, i.group_id AS groupId, i.title, i.status, i.owner_id AS ownerId,
                    u.name AS ownerName, i.due_date AS dueDate, i.priority, i.notes, i.position,
                    i.created_at AS createdAt, i.updated_at AS updatedAt
             FROM task_board_items i
             LEFT JOIN users u ON i.owner_id = u.id
             WHERE i.board_id = ?
             ORDER BY i.group_id, i.position, i.id`,
            [boardId]
        );

        const groupsWithItems = groups.map((g) => ({
            ...g,
            items: items.filter((it) => it.groupId === g.id),
        }));

        res.json({ success: true, data: { board: boards[0], groups: groupsWithItems } });
    } catch (err) {
        console.error('Board full fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});

// ----- Groups -----

router.post('/boards/:boardId/groups', authenticateToken, async (req, res) => {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });

    try {
        const max = await query(
            'SELECT COALESCE(MAX(position), -1) AS maxPos FROM task_board_groups WHERE board_id = ?',
            [req.params.boardId]
        );
        const nextPos = (max[0]?.maxPos ?? -1) + 1;

        const result = await query(
            'INSERT INTO task_board_groups (board_id, name, color, position) VALUES (?, ?, ?, ?)',
            [req.params.boardId, name.trim(), color || '#0073ea', nextPos]
        );
        res.status(201).json({
            success: true,
            data: { id: result.insertId, name: name.trim(), color: color || '#0073ea', position: nextPos, items: [] },
        });
    } catch (err) {
        console.error('Group create error:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

router.put('/groups/:id', authenticateToken, async (req, res) => {
    const { name, color } = req.body;
    try {
        await query('UPDATE task_board_groups SET name = ?, color = ? WHERE id = ?', [
            name,
            color || '#0073ea',
            req.params.id,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error('Group update error:', err);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

router.delete('/groups/:id', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM task_board_groups WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Group delete error:', err);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// ----- Items -----

router.post('/groups/:groupId/items', authenticateToken, async (req, res) => {
    const { title, status, ownerId, dueDate, priority, notes } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const safeStatus = VALID_STATUSES.includes(status) ? status : 'not_started';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    try {
        const groupRows = await query('SELECT board_id FROM task_board_groups WHERE id = ?', [req.params.groupId]);
        if (!groupRows.length) return res.status(404).json({ error: 'Group not found' });
        const boardId = groupRows[0].board_id;

        const max = await query(
            'SELECT COALESCE(MAX(position), -1) AS maxPos FROM task_board_items WHERE group_id = ?',
            [req.params.groupId]
        );
        const nextPos = (max[0]?.maxPos ?? -1) + 1;

        const result = await query(
            `INSERT INTO task_board_items
             (board_id, group_id, title, status, owner_id, due_date, priority, notes, position, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                boardId,
                req.params.groupId,
                title.trim(),
                safeStatus,
                ownerId || null,
                dueDate || null,
                safePriority,
                notes || null,
                nextPos,
                req.user.id,
            ]
        );

        const rows = await query(
            `SELECT i.id, i.group_id AS groupId, i.title, i.status, i.owner_id AS ownerId,
                    u.name AS ownerName, i.due_date AS dueDate, i.priority, i.notes, i.position
             FROM task_board_items i LEFT JOIN users u ON i.owner_id = u.id
             WHERE i.id = ?`,
            [result.insertId]
        );
        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Item create error:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.put('/items/:id', authenticateToken, async (req, res) => {
    const { title, status, ownerId, dueDate, priority, notes, groupId } = req.body;

    const fields = [];
    const params = [];
    if (title !== undefined) {
        fields.push('title = ?');
        params.push(title);
    }
    if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        fields.push('status = ?');
        params.push(status);
    }
    if (ownerId !== undefined) {
        fields.push('owner_id = ?');
        params.push(ownerId || null);
    }
    if (dueDate !== undefined) {
        fields.push('due_date = ?');
        params.push(dueDate || null);
    }
    if (priority !== undefined) {
        if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
        fields.push('priority = ?');
        params.push(priority);
    }
    if (notes !== undefined) {
        fields.push('notes = ?');
        params.push(notes);
    }
    if (groupId !== undefined) {
        fields.push('group_id = ?');
        params.push(groupId);
    }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);

    try {
        await query(`UPDATE task_board_items SET ${fields.join(', ')} WHERE id = ?`, params);
        res.json({ success: true });
    } catch (err) {
        console.error('Item update error:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

router.delete('/items/:id', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM task_board_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Item delete error:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// ----- Updates (comments) -----

router.get('/items/:id/updates', authenticateToken, async (req, res) => {
    try {
        const rows = await query(
            `SELECT u.id, u.content, u.created_at AS createdAt,
                    u.user_id AS userId, usr.name AS userName
             FROM task_board_updates u
             LEFT JOIN users usr ON u.user_id = usr.id
             WHERE u.item_id = ?
             ORDER BY u.created_at DESC`,
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Updates fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

router.post('/items/:id/updates', authenticateToken, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    try {
        const result = await query(
            'INSERT INTO task_board_updates (item_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.id, req.user.id, content.trim()]
        );
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                content: content.trim(),
                createdAt: new Date().toISOString(),
                userId: req.user.id,
                userName: req.user.name,
            },
        });
    } catch (err) {
        console.error('Update create error:', err);
        res.status(500).json({ error: 'Failed to add update' });
    }
});

// ----- Helper: list users (for owner picker) -----
router.get('/assignable-users', authenticateToken, async (req, res) => {
    try {
        const rows = await query('SELECT id, name, email FROM users ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Users fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
