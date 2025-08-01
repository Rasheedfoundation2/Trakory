// router.use((req, res, next) => {
//   res.setHeader('Content-Type', 'application/json');
//   next();
// });
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth-middleware');

// ✅ POST /api/approvals - Create a new approval request
router.post('/', authenticateToken, (req, res) => {
    const { type, details, fromDate, toDate, issueDate } = req.body;
    const userId = req.user.id;

    if (!type || !details || (!fromDate && !toDate && !issueDate)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let query = '';
    let params = [];

    if (type === 'leave') {
      query = 'INSERT INTO approvals (user_id, type, details, from_date, to_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, "pending", NOW(), NOW())';
        params = [userId, type, details, fromDate, toDate];
    } else {
       query = 'INSERT INTO approvals (user_id, type, details, issue_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, "pending", NOW(), NOW())';
        params = [userId, type, details, issueDate];
    }

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to submit approval request' });
        }

        res.json({ success: true, message: 'Request submitted successfully' });
    });
});

// GET /api/approvals
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, type } = req.query;
        const isAdmin = req.user.is_admin; // changed line for all the records from  the datbase to fetch in the admin approvals 
        const adminView = req.query.adminView === 'true'; // for the admin only Approval so he can see  only his request there 

        let query = `
            SELECT 
                a.id,
                a.type,
                a.details,
                a.from_date,
                a.to_date,
                a.issue_date,
                a.status,
                a.created_at,
                a.updated_at,
                u.name as user_name,
                u.email as user_email
            FROM approvals a
            JOIN users u ON a.user_id = u.id
        `;
        
        let conditions = [];
        let params = [];
        
        if (status) {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (type) {
            conditions.push('a.type = ?');
            params.push(type);
        }

       if (!(isAdmin && adminView)) {
    conditions.push('a.user_id = ?');
    params.push(req.user.id);
}  // for the admin only Approval so he can see  only his request there 
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY a.created_at DESC';

        db.query(query, params, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to fetch approvals' 
                });
            }

            res.json({
                success: true,
                data: results.map(approval => ({
                    ...approval,
                    from_date: approval.from_date ? new Date(approval.from_date).toISOString() : null,
                    to_date: approval.to_date ? new Date(approval.to_date).toISOString() : null,
                    issue_date: approval.issue_date ? new Date(approval.issue_date).toISOString() : null,
                    created_at: approval.created_at ? new Date(approval.created_at).toISOString() : null,
                    updated_at: approval.updated_at ? new Date(approval.updated_at).toISOString() : null
                }))
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// PUT /api/approvals/:id/status - Update approval status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const isAdmin = req.user.is_admin; //changes line for the giving approval or rejction to the request of the

        if (!isAdmin) {
            return res.status(403).json({ 
                success: false, 
                error: 'Only admins can update approval status' 
            });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status. Must be "approved" or "rejected"' 
            });
        }

        const updateQuery = 'UPDATE approvals SET status = ?, updated_at = NOW() WHERE id = ?';
        
        db.query(updateQuery, [status, id], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Database error:', updateErr);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to update approval status' 
                });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Approval not found' 
                });
            }

            const getQuery = `
                SELECT 
                    a.*,
                    u.name as user_name,
                    u.email as user_email
                FROM approvals a
                JOIN users u ON a.user_id = u.id
                WHERE a.id = ?
            `;
            
            db.query(getQuery, [id], (getErr, getResults) => {
                if (getErr) {
                    console.error('Database error:', getErr);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Failed to fetch updated approval' 
                    });
                }

                const updatedApproval = getResults[0];
                
                res.json({
                    success: true,
                    message: 'Approval status updated successfully',
                    data: {
                        ...updatedApproval,
                        from_date: updatedApproval.from_date ? new Date(updatedApproval.from_date).toISOString() : null,
                        to_date: updatedApproval.to_date ? new Date(updatedApproval.to_date).toISOString() : null,
                        issue_date: updatedApproval.issue_date ? new Date(updatedApproval.issue_date).toISOString() : null,
                        created_at: updatedApproval.created_at ? new Date(updatedApproval.created_at).toISOString() : null,
                        updated_at: updatedApproval.updated_at ? new Date(updatedApproval.updated_at).toISOString() : null
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

module.exports = router;
