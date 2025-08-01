const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const router = express.Router();

// get the usernames form the users table 
router.get('/users', (req, res) => {
    const sql = `SELECT name FROM users`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        const userNames = results.map(user => user.name);
        res.json(userNames);
    });
});

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// Save feed message
router.post('/feed', upload.array('files'), (req, res) => {
    const { sender, recipients, message, tags } = req.body;
    if (!message?.trim() || !recipients || recipients === '[]') {
        return res.status(400).json({ error: 'Message and recipients are required.' });
    }

    const files = req.files || [];

    const fileNames = files.map(f => f.originalname);
    const filePaths = files.map(f => f.path.replace(/\\/g, '/'));

    const file_name = JSON.stringify(fileNames);
    const file_path = JSON.stringify(filePaths);

    const sql = `INSERT INTO feed_messages (sender, recipients, message, file_name, file_path, tags) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [sender, recipients, message, file_name, file_path, tags], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.status(200).json({ id: result.insertId });
    });
});





// In feed-routes.js
router.get('/project/task', (req, res) => {
    const sql = `SELECT name FROM project_task WHERE is_deleted = 0`; // Fetch name
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.json(results); // Return the full results with id and name
    });
});

router.get('/feed/:username', (req, res) => {
    const username = req.params.username;
    const sql = `
      SELECT id, sender, recipients, message, file_name, file_path, tags, timestamp 
      FROM feed_messages 
      WHERE FIND_IN_SET(?, REPLACE(REPLACE(REPLACE(recipients, '[', ''), ']', ''), '"', '')) > 0
         OR sender = ?
      ORDER BY timestamp DESC
    `;

    db.query(sql, [username, username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.json(results);
    });
});

// Save task
router.post('/feed/task', upload.array('files'), (req, res) => {
    const { sender, taskName, taskDescription, assignees, createdBy, participants, observers, deadline, projects } = req.body;
    
    if (!taskName?.trim()) {
        return res.status(400).json({ error: 'Task name is required.' });
    }

    const files = req.files || [];
    const fileNames = files.map(f => f.originalname);
    const filePaths = files.map(f => f.path.replace(/\\/g, '/'));

    const sql = `INSERT INTO feed_tasks 
    (sender, task_name, task_description, assignees, created_by, participants, observers, deadline, projects, file_name, file_path, timestamp) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    
    db.query(sql, [
        sender,
        taskName,
        taskDescription,
        assignees,
        createdBy,
        participants,
        observers,
        deadline,
        projects,
        JSON.stringify(fileNames),
        JSON.stringify(filePaths)
    ], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.status(200).json({ id: result.insertId });
    });
});

// Get tasks for a user
router.get('/feed/task/:username', (req, res) => {
    const username = req.params.username;
    const sql = `
        SELECT * FROM feed_tasks 
        WHERE JSON_CONTAINS(assignees, '["${username}"]') 
           OR JSON_CONTAINS(created_by, '["${username}"]')
           OR JSON_CONTAINS(participants, '["${username}"]')
           OR JSON_CONTAINS(observers, '["${username}"]')
           OR sender = ?
        ORDER BY timestamp DESC
    `;

    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.json(results);
    });
});

// Get events for a user
router.get('/events', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // In a real app, verify the token here
    
    const sql = `SELECT * FROM events ORDER BY StartDate DESC`;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', err });
        res.json(results);
    });
});





module.exports = router;
