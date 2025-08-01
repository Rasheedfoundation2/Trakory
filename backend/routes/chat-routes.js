// routes/chat-routes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

// Encryption configuration
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || crypto.randomBytes(32); // 256-bit key
const IV_LENGTH = 16; // For AES, this is always 16

// Encryption functions
function encrypt(text) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', 
            Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error('Encryption error:', err);
        return text; // fallback to unencrypted
    }
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', 
            Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error('Decryption error:', err);
        return text; // fallback to encrypted text
    }
}

// Get all chat rooms for current user
router.get('/rooms', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const query = `
        SELECT DISTINCT cr.*, 
               CASE 
                   WHEN cr.type = 'direct' THEN 
                       (SELECT u.name FROM users u 
                        JOIN chat_participants cp ON u.id = cp.user_id 
                        WHERE cp.room_id = cr.id AND cp.user_id != ?)
                   ELSE cr.name 
               END as display_name,
               (SELECT COUNT(*) FROM chat_messages cm 
                WHERE cm.room_id = cr.id AND cm.created_at > COALESCE(cp.last_seen, '1970-01-01')) as unread_count
        FROM chat_rooms cr
        JOIN chat_participants cp ON cr.id = cp.room_id
        WHERE cp.user_id = ?
        ORDER BY cr.updated_at DESC
    `;
    
    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching chat rooms:', err);
            return res.status(500).json({ error: 'Failed to fetch chat rooms' });
        }
        res.json(results);
    });
});

// Get or create direct chat room between two users
router.get('/room/direct/:otherUserId', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId);
    
    // Check if direct room already exists
    const checkQuery = `
        SELECT cr.* FROM chat_rooms cr
        WHERE cr.type = 'direct' AND cr.id IN (
            SELECT cp1.room_id FROM chat_participants cp1
            WHERE cp1.user_id = ? AND cp1.room_id IN (
                SELECT cp2.room_id FROM chat_participants cp2
                WHERE cp2.user_id = ?
            )
        )
    `;
    
    db.query(checkQuery, [userId, otherUserId], (err, results) => {
        if (err) {
            console.error('Error checking for existing room:', err);
            return res.status(500).json({ error: 'Failed to check for existing room' });
        }
        
        if (results.length > 0) {
            return res.json(results[0]);
        }
        
        // Create new direct room
        const createRoomQuery = 'INSERT INTO chat_rooms (type, created_by) VALUES (?, ?)';
        db.query(createRoomQuery, ['direct', userId], (err, result) => {
            if (err) {
                console.error('Error creating room:', err);
                return res.status(500).json({ error: 'Failed to create room' });
            }
            
            const roomId = result.insertId;
            
            // Add both users as participants
            const addParticipantsQuery = 'INSERT INTO chat_participants (room_id, user_id) VALUES (?, ?), (?, ?)';
            db.query(addParticipantsQuery, [roomId, userId, roomId, otherUserId], (err) => {
                if (err) {
                    console.error('Error adding participants:', err);
                    return res.status(500).json({ error: 'Failed to add participants' });
                }
                
                res.json({ id: roomId, type: 'direct', created_by: userId });
            });
        });
    });
});

// Get messages for a specific room
router.get('/room/:roomId/messages', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const roomId = req.params.roomId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Check if user is participant in the room
    const checkParticipantQuery = 'SELECT 1 FROM chat_participants WHERE room_id = ? AND user_id = ?';
    db.query(checkParticipantQuery, [roomId, userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const messagesQuery = `
            SELECT cm.*, u.name as sender_name, u.email as sender_email
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = ? AND cm.is_deleted = 0
            ORDER BY cm.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        db.query(messagesQuery, [roomId, limit, offset], (err, results) => {
            if (err) {
                console.error('Error fetching messages:', err);
                return res.status(500).json({ error: 'Failed to fetch messages' });
            }
            
            // Decrypt messages
            const decryptedMessages = results.map(message => ({
                ...message,
                content: decrypt(message.encrypted_content),
                encrypted_content: undefined
            }));
            
            res.json(decryptedMessages.reverse());
        });
    });
});

// Send a message
router.post('/room/:roomId/message', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const roomId = req.params.roomId;
    const { content, messageType = 'text' } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Check if user is participant in the room
    const checkParticipantQuery = 'SELECT 1 FROM chat_participants WHERE room_id = ? AND user_id = ?';
    db.query(checkParticipantQuery, [roomId, userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Encrypt the message
        const encryptedContent = encrypt(content);
        
        const insertQuery = `
            INSERT INTO chat_messages (room_id, sender_id, encrypted_content, message_type)
            VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [roomId, userId, encryptedContent, messageType], (err, result) => {
            if (err) {
                console.error('Error sending message:', err);
                return res.status(500).json({ error: 'Failed to send message' });
            }
            
            // Update room's updated_at timestamp
            const updateRoomQuery = 'UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            db.query(updateRoomQuery, [roomId], () => {});
            
            // Get the sent message with sender info
            const getMessageQuery = `
                SELECT cm.*, u.name as sender_name, u.email as sender_email
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.id
                WHERE cm.id = ?
            `;
            
            db.query(getMessageQuery, [result.insertId], (err, messageResults) => {
                if (err) {
                    return res.status(500).json({ error: 'Message sent but failed to retrieve' });
                }
                
                const message = messageResults[0];
                res.json({
                    ...message,
                    content: content,
                    encrypted_content: undefined
                });
            });
        });
    });
});

// Get all users for chat (excluding current user)
router.get('/users', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const query = 'SELECT id, name, email FROM users WHERE id != ? ORDER BY name';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
});;

// Mark messages as read
router.post('/room/:roomId/mark-read', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const roomId = req.params.roomId;
    
    // Update last_seen timestamp for the user in this room
    const updateQuery = 'UPDATE chat_participants SET last_seen = CURRENT_TIMESTAMP WHERE room_id = ? AND user_id = ?';
    db.query(updateQuery, [roomId, userId], (err) => {
        if (err) {
            console.error('Error marking messages as read:', err);
            return res.status(500).json({ error: 'Failed to mark messages as read' });
        }
        res.json({ success: true });
    });
});

module.exports = router;