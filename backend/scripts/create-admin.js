const db = require('../config/db');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin User';

if (!email || !password) {
    console.error('Usage: node create-admin.js <email> <password> [name]');
    process.exit(1);
}

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Database connection or query failed:', err.message);
                process.exit(1);
            }
            
            if (results.length > 0) {
                // User exists, promote to admin and update password
                db.query(
                    'UPDATE users SET password = ?, is_admin = 1 WHERE email = ?',
                    [hashedPassword, email],
                    (err) => {
                        if (err) {
                            console.error('Update error:', err.message);
                            process.exit(1);
                        }
                        console.log(`Promoted ${email} to admin and updated password.`);
                        process.exit(0);
                    }
                );
            } else {
                // User does not exist, insert new admin
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
                    [name, email, hashedPassword],
                    (err) => {
                        if (err) {
                            console.error('Insert error:', err.message);
                            process.exit(1);
                        }
                        console.log(`Created admin user ${email}.`);
                        process.exit(0);
                    }
                );
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        process.exit(1);
    }
}

createAdmin();
