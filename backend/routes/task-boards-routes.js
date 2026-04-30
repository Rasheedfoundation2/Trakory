// Monday-style internal task management tool — standalone routes.
// Uses its own bundled SQLite database (better-sqlite3) so this tool runs
// independently of the rest of the app's MySQL setup.

const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const router = express.Router();

const VALID_STATUSES = ['not_started', 'working_on_it', 'stuck', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const DEFAULT_USERS = [
    { id: 1, name: 'Alex Rivera', email: 'alex@trakory.local' },
    { id: 2, name: 'Priya Shah', email: 'priya@trakory.local' },
    { id: 3, name: 'Jordan Lee', email: 'jordan@trakory.local' },
    { id: 4, name: 'Sam Chen', email: 'sam@trakory.local' },
];

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'task_boards.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS tb_users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tb_boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tb_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#0073ea',
        position INTEGER DEFAULT 0,
        FOREIGN KEY (board_id) REFERENCES tb_boards(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tb_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        owner_id INTEGER,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        position INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (board_id) REFERENCES tb_boards(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES tb_groups(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tb_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES tb_items(id) ON DELETE CASCADE
    );
`);

const userInsert = db.prepare('INSERT OR IGNORE INTO tb_users (id, name, email) VALUES (?, ?, ?)');
DEFAULT_USERS.forEach((u) => userInsert.run(u.id, u.name, u.email));

// Seed a sample board on first run so the UI has something to show.
const boardCount = db.prepare('SELECT COUNT(*) AS c FROM tb_boards').get().c;
if (boardCount === 0) {
    const seedBoard = db.prepare(
        'INSERT INTO tb_boards (name, description, owner_id) VALUES (?, ?, ?)'
    ).run('Team Sprint', 'A sample board to get you started.', 1);

    const seedGroup = db.prepare(
        'INSERT INTO tb_groups (board_id, name, color, position) VALUES (?, ?, ?, ?)'
    );
    const todoId = seedGroup.run(seedBoard.lastInsertRowid, 'To Do', '#0073ea', 0).lastInsertRowid;
    const inProgId = seedGroup.run(seedBoard.lastInsertRowid, 'In Progress', '#fdab3d', 1).lastInsertRowid;
    const doneId = seedGroup.run(seedBoard.lastInsertRowid, 'Done', '#00c875', 2).lastInsertRowid;

    const seedItem = db.prepare(
        `INSERT INTO tb_items
         (board_id, group_id, title, status, owner_id, due_date, priority, notes, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    seedItem.run(seedBoard.lastInsertRowid, todoId, 'Draft Q3 roadmap', 'not_started', 2, null, 'high', null, 0);
    seedItem.run(seedBoard.lastInsertRowid, todoId, 'Review supplier contracts', 'not_started', 4, null, 'medium', null, 1);
    seedItem.run(seedBoard.lastInsertRowid, inProgId, 'Onboarding flow redesign', 'working_on_it', 1, null, 'high', null, 0);
    seedItem.run(seedBoard.lastInsertRowid, inProgId, 'Migrate analytics dashboard', 'stuck', 3, null, 'critical', null, 1);
    seedItem.run(seedBoard.lastInsertRowid, doneId, 'Publish March newsletter', 'done', 2, null, 'low', null, 0);
}

// ----- Boards -----

router.get('/boards', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT b.id, b.name, b.description, b.owner_id AS ownerId,
                   u.name AS ownerName, b.is_archived AS isArchived,
                   b.created_at AS createdAt, b.updated_at AS updatedAt,
                   (SELECT COUNT(*) FROM tb_items i WHERE i.board_id = b.id) AS itemCount
            FROM tb_boards b
            LEFT JOIN tb_users u ON b.owner_id = u.id
            WHERE b.is_archived = 0
            ORDER BY b.created_at DESC
        `).all();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Boards fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

router.post('/boards', (req, res) => {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Board name is required' });

    try {
        const result = db.prepare(
            'INSERT INTO tb_boards (name, description, owner_id) VALUES (?, ?, ?)'
        ).run(name.trim(), description || null, 1);
        const boardId = result.lastInsertRowid;

        const insertGroup = db.prepare(
            'INSERT INTO tb_groups (board_id, name, color, position) VALUES (?, ?, ?, ?)'
        );
        insertGroup.run(boardId, 'To Do', '#0073ea', 0);
        insertGroup.run(boardId, 'In Progress', '#fdab3d', 1);
        insertGroup.run(boardId, 'Done', '#00c875', 2);

        res.status(201).json({ success: true, data: { id: boardId, name: name.trim(), description: description || null } });
    } catch (err) {
        console.error('Board create error:', err);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

router.put('/boards/:id', (req, res) => {
    const { name, description } = req.body;
    try {
        db.prepare("UPDATE tb_boards SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?").run(
            name,
            description || null,
            req.params.id
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Board update error:', err);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

router.delete('/boards/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM tb_boards WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Board delete error:', err);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});

router.get('/boards/:id/full', (req, res) => {
    try {
        const board = db.prepare(`
            SELECT b.id, b.name, b.description, b.owner_id AS ownerId, u.name AS ownerName
            FROM tb_boards b LEFT JOIN tb_users u ON b.owner_id = u.id
            WHERE b.id = ?
        `).get(req.params.id);
        if (!board) return res.status(404).json({ error: 'Board not found' });

        const groups = db.prepare(
            'SELECT id, name, color, position FROM tb_groups WHERE board_id = ? ORDER BY position, id'
        ).all(req.params.id);

        const items = db.prepare(`
            SELECT i.id, i.group_id AS groupId, i.title, i.status, i.owner_id AS ownerId,
                   u.name AS ownerName, i.due_date AS dueDate, i.priority, i.notes, i.position,
                   i.created_at AS createdAt, i.updated_at AS updatedAt
            FROM tb_items i
            LEFT JOIN tb_users u ON i.owner_id = u.id
            WHERE i.board_id = ?
            ORDER BY i.group_id, i.position, i.id
        `).all(req.params.id);

        const groupsWithItems = groups.map((g) => ({
            ...g,
            items: items.filter((it) => it.groupId === g.id),
        }));

        res.json({ success: true, data: { board, groups: groupsWithItems } });
    } catch (err) {
        console.error('Board full fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});

// ----- Groups -----

router.post('/boards/:boardId/groups', (req, res) => {
    const { name, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Group name is required' });

    try {
        const max = db.prepare(
            "SELECT COALESCE(MAX(position), -1) AS maxPos FROM tb_groups WHERE board_id = ?"
        ).get(req.params.boardId);
        const nextPos = (max.maxPos ?? -1) + 1;

        const result = db.prepare(
            'INSERT INTO tb_groups (board_id, name, color, position) VALUES (?, ?, ?, ?)'
        ).run(req.params.boardId, name.trim(), color || '#0073ea', nextPos);

        res.status(201).json({
            success: true,
            data: { id: result.lastInsertRowid, name: name.trim(), color: color || '#0073ea', position: nextPos, items: [] },
        });
    } catch (err) {
        console.error('Group create error:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

router.put('/groups/:id', (req, res) => {
    const { name, color } = req.body;
    try {
        db.prepare('UPDATE tb_groups SET name = ?, color = ? WHERE id = ?').run(
            name,
            color || '#0073ea',
            req.params.id
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Group update error:', err);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

router.delete('/groups/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM tb_groups WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Group delete error:', err);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// ----- Items -----

router.post('/groups/:groupId/items', (req, res) => {
    const { title, status, ownerId, dueDate, priority, notes } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const safeStatus = VALID_STATUSES.includes(status) ? status : 'not_started';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    try {
        const group = db.prepare('SELECT board_id FROM tb_groups WHERE id = ?').get(req.params.groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const max = db.prepare(
            'SELECT COALESCE(MAX(position), -1) AS maxPos FROM tb_items WHERE group_id = ?'
        ).get(req.params.groupId);
        const nextPos = (max.maxPos ?? -1) + 1;

        const result = db.prepare(
            `INSERT INTO tb_items
             (board_id, group_id, title, status, owner_id, due_date, priority, notes, position)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            group.board_id,
            req.params.groupId,
            title.trim(),
            safeStatus,
            ownerId || null,
            dueDate || null,
            safePriority,
            notes || null,
            nextPos
        );

        const row = db.prepare(`
            SELECT i.id, i.group_id AS groupId, i.title, i.status, i.owner_id AS ownerId,
                   u.name AS ownerName, i.due_date AS dueDate, i.priority, i.notes, i.position
            FROM tb_items i LEFT JOIN tb_users u ON i.owner_id = u.id
            WHERE i.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ success: true, data: row });
    } catch (err) {
        console.error('Item create error:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.put('/items/:id', (req, res) => {
    const { title, status, ownerId, dueDate, priority, notes, groupId } = req.body;

    const fields = [];
    const params = [];
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        fields.push('status = ?'); params.push(status);
    }
    if (ownerId !== undefined) { fields.push('owner_id = ?'); params.push(ownerId || null); }
    if (dueDate !== undefined) { fields.push('due_date = ?'); params.push(dueDate || null); }
    if (priority !== undefined) {
        if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
        fields.push('priority = ?'); params.push(priority);
    }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (groupId !== undefined) { fields.push('group_id = ?'); params.push(groupId); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    fields.push("updated_at = datetime('now')");
    params.push(req.params.id);

    try {
        db.prepare(`UPDATE tb_items SET ${fields.join(', ')} WHERE id = ?`).run(...params);
        res.json({ success: true });
    } catch (err) {
        console.error('Item update error:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

router.delete('/items/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM tb_items WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Item delete error:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// ----- Updates (comments) -----

router.get('/items/:id/updates', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT u.id, u.content, u.created_at AS createdAt,
                   u.user_id AS userId, usr.name AS userName
            FROM tb_updates u LEFT JOIN tb_users usr ON u.user_id = usr.id
            WHERE u.item_id = ?
            ORDER BY u.created_at DESC
        `).all(req.params.id);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Updates fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

router.post('/items/:id/updates', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    try {
        const userId = 1;
        const result = db.prepare(
            'INSERT INTO tb_updates (item_id, user_id, content) VALUES (?, ?, ?)'
        ).run(req.params.id, userId, content.trim());

        const user = db.prepare('SELECT name FROM tb_users WHERE id = ?').get(userId);
        res.status(201).json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                content: content.trim(),
                createdAt: new Date().toISOString(),
                userId,
                userName: user?.name ?? 'You',
            },
        });
    } catch (err) {
        console.error('Update create error:', err);
        res.status(500).json({ error: 'Failed to add update' });
    }
});

router.get('/assignable-users', (req, res) => {
    try {
        const rows = db.prepare('SELECT id, name, email FROM tb_users ORDER BY name').all();
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Users fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
