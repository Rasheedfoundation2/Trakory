// routes/events.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

//  for fetching users

router.get('/users', authenticateToken, (req, res) => {
    const loggedInUserId = req.user.id; // Assuming your auth middleware adds user info to req
    
    db.query('SELECT id, name FROM users WHERE id != ?', [loggedInUserId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
});

// //Create event
// router.post('/events', authenticateToken, (req, res) => {
//     const { title, description, start, end, type, assignee_id } = req.body;
//     const sender_id = req.user.id; // Get sender ID from authenticated user

//     if (!title || !start || !end) {
//         return res.status(400).json({ error: 'Title, start, and end are required' });
//     }

//     const query = `
//         INSERT INTO events 
//         (Sender, EventTitle, EventDescription, Assignees, StartDate, EndDate, Type, created_at, updated_at) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
//     `;

//     db.query(query, 
//         [sender_id, title, description, assignee_id, start, end, type || 'primary'], 
//         (err, results) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({ error: 'Failed to create event' });
//             }
//             res.status(201).json({ id: results.insertId });
//         }
//     );
// });

// // Get all events
// router.get('/events', authenticateToken, (req, res) => {
//     const userId = req.user.id; // Get current user ID
    
//     const query = `
//         SELECT 
//             id, 
//             EventTitle as title, 
//             EventDescription as description, 
//             StartDate as start, 
//             EndDate as end, 
//             Type as type,
//             Assignees as assignee_id
//         FROM events
//         WHERE Sender = ? OR Assignees = ?
//     `;

//     db.query(query, [userId, userId], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Failed to fetch events' });
//         }
//         res.json(results);
//     });
// });

// // Update event
// router.put('/events/:id', authenticateToken, (req, res) => {
//     const eventId = req.params.id;
//     const { title, description, start, end, type, assignee_id } = req.body;
//     const userId = req.user.id; // Get current user ID

//     // First check if event exists and belongs to user
//     db.query('SELECT Sender FROM events WHERE id = ?', [eventId], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
        
//         if (results.length === 0) {
//             return res.status(404).json({ error: 'Event not found' });
//         }
        
//         if (results[0].Sender !== userId) {
//             return res.status(403).json({ error: 'Not authorized to edit this event' });
//         }

//         const query = `
//             UPDATE events 
//             SET 
//                 EventTitle = ?,
//                 EventDescription = ?,
//                 Assignees = ?,
//                 StartDate = ?,
//                 EndDate = ?,
//                 Type = ?,
//                 updated_at = NOW()
//             WHERE id = ?
//         `;

//         db.query(query, 
//             [title, description, assignee_id, start, end, type || 'primary', eventId], 
//             (err, results) => {
//                 if (err) {
//                     console.error('Database error:', err);
//                     return res.status(500).json({ error: 'Failed to update event' });
//                 }
//                 res.json({ message: 'Event updated successfully' });
//             }
//         );
//     });
// });


// Uncomment and modify the create event route
router.post('/events', authenticateToken, (req, res) => {
    const { title, description, start, end, type, assignees } = req.body;
    const sender_id = req.user.id;

    if (!title || !start || !end) {
        return res.status(400).json({ error: 'Title, start, and end are required' });
    }

    // First get the sender's name
    db.query('SELECT name FROM users WHERE id = ?', [sender_id], (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch user' });
        }
        
        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const senderName = userResults[0].name;
        const assigneesStr = Array.isArray(assignees) ? assignees.join(',') : assignees;

        const query = `
            INSERT INTO events 
            (Sender, EventTitle, EventDescription, Assignees, StartDate, EndDate, Type, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        db.query(query, 
            [senderName, title, description, assigneesStr, start, end, type || 'primary'], 
            (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create event' });
                }
                res.status(201).json({ id: results.insertId });
            }
        );
    });
});


// Uncomment and modify the get all events route
router.get('/events', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    // First get the current user's name
    db.query('SELECT name FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch user' });
        }
        
        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userName = userResults[0].name;
        
        const query = `
            SELECT 
                id, 
                EventTitle as title, 
                EventDescription as description, 
                StartDate as start, 
                EndDate as end, 
                Type as type,
                Assignees as assignees,
                Sender as sender_name
            FROM events
            WHERE Sender = ? OR FIND_IN_SET(?, Assignees)
        `;

        db.query(query, [userName, userName], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch events' });
            }
            res.json(results);
        });
    });
});

// Uncomment and modify the update event route
router.put('/events/:id', authenticateToken, (req, res) => {
    const eventId = req.params.id;
    const { title, description, start, end, type, assignees } = req.body;
    const userId = req.user.id;

    // Convert array of assignee names to a comma-separated string
    const assigneesStr = Array.isArray(assignees) ? assignees.join(',') : assignees;

    db.query('SELECT Sender FROM events WHERE id = ?', [eventId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Since we're now storing names, we need to check if the current user is the original sender
        // We'll need to get the original sender's name and compare it to the current user's name
        db.query('SELECT name FROM users WHERE id = ?', [userId], (err, userResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const currentUserName = userResults[0].name;
            const originalSenderName = results[0].Sender;
            
            if (originalSenderName !== currentUserName) {
                return res.status(403).json({ error: 'Not authorized to edit this event' });
            }

            const query = `
                UPDATE events 
                SET 
                    EventTitle = ?,
                    EventDescription = ?,
                    Assignees = ?,
                    StartDate = ?,
                    EndDate = ?,
                    Type = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;

            db.query(query, 
                [title, description, assigneesStr, start, end, type || 'primary', eventId], 
                (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to update event' });
                    }
                    res.json({ message: 'Event updated successfully' });
                }
            );
        });
    });
});

module.exports = router;