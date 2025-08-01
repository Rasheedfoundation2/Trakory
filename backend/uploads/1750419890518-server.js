require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration constants
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employee_management'
});

// Connect to database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Import and use project routes
const projectRoutes = require('./routes/projects-routes'); // Adjust path as needed
app.use('/api/project_task', projectRoutes);

// User authentication endpoints
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) throw err;
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.query('SELECT COUNT(*) as count FROM users', (err, countResults) => {
                const is_admin = countResults[0].count === 0;
                
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                    [name, email, hashedPassword, is_admin],
                    (err, result) => {
                        if (err) throw err;
                        
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

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

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

app.get('/user-info', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        db.query(
            'SELECT id, name, email, is_admin FROM users WHERE id = ?',
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (results.length === 0) return res.status(404).json({ error: 'User not found' });

                res.json({
                    id: results[0].id,
                    name: results[0].name,
                    email: results[0].email,
                    is_admin: results[0].is_admin
                });
            }
        );
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Helper functions for time formatting
const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Calendar Event Endpoints
app.get('/api/events', (req, res) => {
    db.query('SELECT * FROM events', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
        res.json(results);
    });
});

app.post('/api/events', (req, res) => {
    const { title, start, end, description, type } = req.body;
    
    // Validate required fields
    if (!title || !start || !end || !type) {
        return res.status(400).json({ error: 'Missing required fields: title, start, end, and type are required' });
    }

    // Validate date formats
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start date format' });
    }
    if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid end date format' });
    }
    if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Validate event type
    const validTypes = ['primary', 'info', 'success', 'danger'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    db.query(
        'INSERT INTO events (title, start, end, description, type) VALUES (?, ?, ?, ?, ?)',
        [title, startDate, endDate, description || null, type],
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create event' });
            }
            res.status(201).json({ 
                id: result.insertId, 
                title, 
                start: startDate.toISOString(), 
                end: endDate.toISOString(), 
                description, 
                type 
            });
        }
    );
});

app.put('/api/events/:id', (req, res) => {
    const { title, start, end, description, type } = req.body;
    
    // Validate required fields
    if (!title || !start || !end || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date formats
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    db.query(
        'UPDATE events SET title = ?, start = ?, end = ?, description = ?, type = ? WHERE id = ?',
        [title, startDate, endDate, description || null, type, req.params.id],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update event' });
            }
            res.json({ message: 'Event updated successfully' });
        }
    );
});

app.delete('/api/events/:id', (req, res) => {
    const { title, start, end, description, type } = req.body;
    
    // Validate required fields
    if (!title || !start || !end || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date formats
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    db.query(
        'UPDATE events SET title = ?, start = ?, end = ?, description = ?, type = ? WHERE id = ?',
        [title, startDate, endDate, description || null, type, req.params.id],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update event' });
            }
            res.json({ message: 'Event updated successfully' });
        }
    );
});

app.delete('/api/events/:id', (req, res) => {
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete event' });
        }
        res.json({ message: 'Event deleted successfully' });
    });
});

// ==================== TIME TRACKING ENDPOINTS ====================

app.post('/api/timers/start', authenticateToken, (req, res) => {
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

app.post('/api/timers/break', authenticateToken, (req, res) => {
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

app.post('/api/timers/continue', authenticateToken, (req, res) => {
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

app.post('/api/timers/end', authenticateToken, (req, res) => {
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

app.get('/api/timers/current', authenticateToken, (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));