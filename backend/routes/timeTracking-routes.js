// routes/time-tracking.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');
const { formatTime, parseTime } = require('../utils/time-utils');

// Start timer
router.post('/start', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Check for existing active session
    db.query(
        'SELECT id FROM time_sessions WHERE user_id = ? AND status IN ("active", "paused")',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length > 0) {
                return res.status(400).json({ error: 'Active session already exists' });
            }

            // Create new session
            db.query(
                'INSERT INTO time_sessions (user_id, start_time, status, total_work_duration, total_break_duration) VALUES (?, NOW(), "active", "00:00:00", "00:00:00")',
                [userId],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.status(201).json({ 
                        message: 'Time tracking started',
                        startTime: new Date().toISOString()
                    });
                }
            );
        }
    );
});

// Start break
router.post('/break', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Get active time session
    db.query(
        'SELECT id, start_time, total_work_duration FROM time_sessions WHERE user_id = ? AND status = "active"',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) {
                return res.status(400).json({ error: 'No active time session' });
            }

            const timeSessionId = results[0].id;
            const startTime = new Date(results[0].start_time);
            const now = new Date();
            
            // Calculate exact work duration up to now
            const workDuration = Math.floor((now - startTime) / 1000);
            const formattedWorkDuration = formatTime(workDuration);

            // Update session to paused state and set break start time
            db.query(
                'UPDATE time_sessions SET status = "paused", break_start_time = NOW(), total_work_duration = ? WHERE id = ?',
                [formattedWorkDuration, timeSessionId],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.status(201).json({ 
                        message: 'Break started',
                        breakStartTime: new Date().toISOString(),
                        workDuration: formattedWorkDuration
                    });
                }
            );
        }
    );
});

// Continue after break
router.post('/continue', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Get paused time session
    db.query(
        'SELECT id, break_start_time, total_break_duration FROM time_sessions WHERE user_id = ? AND status = "paused"',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) {
                return res.status(400).json({ error: 'No active break session' });
            }

            const timeSessionId = results[0].id;
            const breakStart = new Date(results[0].break_start_time);
            const now = new Date();
            const breakDuration = Math.floor((now - breakStart) / 1000);

            // Calculate total break duration
            const prevBreakDuration = parseTime(results[0].total_break_duration || '00:00:00');
            const totalBreakSeconds = prevBreakDuration + breakDuration;
            const formattedBreakDuration = formatTime(totalBreakSeconds);

            // Resume the main time session
            db.query(
                'UPDATE time_sessions SET status = "active", break_start_time = NULL, total_break_duration = ?, start_time = NOW() WHERE id = ?',
                [formattedBreakDuration, timeSessionId],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ 
                        message: 'Session resumed',
                        breakDuration: formattedBreakDuration
                    });
                }
            );
        }
    );
});

// End timer
router.post('/end', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // Get active time session
    db.query(
        'SELECT id, start_time, break_start_time, status, total_work_duration, total_break_duration FROM time_sessions WHERE user_id = ? AND (status = "active" OR status = "paused")',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) {
                return res.status(400).json({ error: 'No active time session' });
            }

            const session = results[0];
            const now = new Date();
            let workDuration = 0;
            let breakDuration = 0;

            // Calculate final durations based on current state
            if (session.status === 'active') {
                const startTime = new Date(session.start_time);
                workDuration = Math.floor((now - startTime) / 1000);
            } else if (session.status === 'paused') {
                const breakStart = new Date(session.break_start_time);
                breakDuration = Math.floor((now - breakStart) / 1000);
            }

            // Calculate totals
            const prevWorkDuration = parseTime(session.total_work_duration || '00:00:00');
            const totalWorkSeconds = prevWorkDuration + workDuration;
            const formattedWorkDuration = formatTime(totalWorkSeconds);
            
            const prevBreakDuration = parseTime(session.total_break_duration || '00:00:00');
            const totalBreakSeconds = prevBreakDuration + breakDuration;
            const formattedBreakDuration = formatTime(totalBreakSeconds);

            // End the time session
            db.query(
                'UPDATE time_sessions SET end_time = NOW(), status = "completed", total_work_duration = ?, total_break_duration = ? WHERE id = ?',
                [formattedWorkDuration, formattedBreakDuration, session.id],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ 
                        message: 'Session ended successfully',
                        workDuration: formattedWorkDuration,
                        breakDuration: formattedBreakDuration
                    });
                }
            );
        }
    );
});

// Get current timer status
router.get('/current', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.query(
        `SELECT 
            id,
            start_time,
            break_start_time,
            status,
            total_work_duration,
            total_break_duration
        FROM time_sessions
        WHERE user_id = ? AND (status = 'active' OR status = 'paused')
        ORDER BY id DESC LIMIT 1`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            if (results.length === 0) {
                return res.json({ active: false });
            }

            const session = results[0];
            res.json({
                active: true,
                isWorking: session.status === 'active',
                isOnBreak: session.status === 'paused',
                startTime: session.start_time,
                breakStartTime: session.break_start_time,
                totalWorkTime: session.total_work_duration || '00:00:00',
                totalBreakTime: session.total_break_duration || '00:00:00'
            });
        }
    );
});

module.exports = router;