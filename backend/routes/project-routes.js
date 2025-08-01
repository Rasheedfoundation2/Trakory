const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add a new project
router.post('/projects', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const query = 'INSERT INTO projects (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            console.error('Error inserting project:', err);
            return res.status(500).json({ error: 'Failed to insert project' });
        }
        res.status(201).json({ message: 'Project added', projectId: result.insertId });
    });
});
router.get('/projects', (req, res) => {
    const query = 'SELECT id, name FROM projects'; // ✅ Include id for dropdown value
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).json({ error: 'Failed to fetch projects' });
        }
        res.json(results); // ✅ Return actual result set
    });
});

// Get all project status columns
router.get('/columns', (req, res) => {
    const query = 'SELECT id, name FROM project_statuses';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching columns:', err);
            return res.status(500).json({ error: 'Failed to fetch columns' });
        }
        res.json(results);
    });
});

router.post('/tasks', (req, res) => {
    const { title, description, tags, date, projectId, statusId } = req.body;

    const query = 'INSERT INTO tasks (title, description, tags, date, project_id, status_id) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [title, description, tags, date, projectId, statusId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).json({ error: 'Failed to add task' });
        }
        res.status(201).json({ message: 'Task added', taskId: result.insertId });
    });
});



router.get('/columns-with-tasks', (req, res) => {
    const query = `
        SELECT ps.id AS statusId, ps.name AS statusName, 
               t.id AS taskId, t.title, t.description, t.tags, t.date, 
               t.project_id, p.name AS projectName
        FROM project_statuses ps
        LEFT JOIN tasks t ON ps.id = t.status_id
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY ps.id, t.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching columns with tasks:', err);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }

        const columns = {};

        results.forEach(row => {
            if (!columns[row.statusId]) {
                columns[row.statusId] = {
                    id: row.statusId,
                    title: row.statusName,
                    tasks: []
                };
            }

            if (row.taskId) {
                columns[row.statusId].tasks.push({
                    id: row.taskId,
                    title: row.title,
                    description: row.description,
                    tags: row.tags ? row.tags.split(',') : [],
                    date: row.date,
                    projectId: row.project_id,
                    projectName: row.projectName || 'N/A' // ✅ ADD THIS FIELD
                });
            }
        });

        res.json(Object.values(columns));
    });
});

// Update task status when dragged to another column
router.put('/tasks/:id/status', (req, res) => {
    const taskId = req.params.id;
    const { statusId } = req.body;

    const query = 'UPDATE tasks SET status_id = ? WHERE id = ?';
    db.query(query, [statusId, taskId], (err, result) => {
        if (err) {
            console.error('Error updating task status:', err);
            return res.status(500).json({ error: 'Failed to update task status' });
        }
        res.json({ message: 'Status updated successfully' });
    });
});

// Add this near the bottom of your project-routes.js
router.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const query = 'DELETE FROM tasks WHERE id = ?';
    db.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).json({ error: 'Failed to delete task' });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});


// Update an existing task
router.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, tags, date, projectId, statusId } = req.body;

    const query = `
        UPDATE tasks 
        SET title = ?, description = ?, tags = ?, date = ?, project_id = ?, status_id = ? 
        WHERE id = ?
    `;

    const values = [title, description, tags, date, projectId, statusId, taskId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Failed to update task' });
        }
        res.json({ message: 'Task updated successfully' });
    });
});




module.exports = router;
