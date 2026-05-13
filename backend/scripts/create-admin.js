// Create or promote an admin user in the Trakory MySQL database.
//
// Usage:
//   cd backend
//   node scripts/create-admin.js <email> <password> [name]
//
// Examples:
//   node scripts/create-admin.js admin@pered.ae StrongPass123 "Site Admin"
//   node scripts/create-admin.js m.rasheed@pered.ae NewPass123
//
// Behaviour:
//   - If the email exists, its password is reset and is_admin is set to 1.
//   - If it doesn't exist, a new admin user is inserted.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql');

const [, , emailArg, passwordArg, nameArg] = process.argv;

if (!emailArg || !passwordArg) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [name]');
    process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const name = (nameArg || email.split('@')[0]).trim();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'intern_management',
});

db.connect(async (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }

    try {
        const hashed = await bcrypt.hash(passwordArg, 10);

        db.query('SELECT id FROM users WHERE email = ?', [email], (err, rows) => {
            if (err) {
                console.error('Query error:', err.message);
                db.end();
                process.exit(1);
            }

            if (rows.length) {
                db.query(
                    'UPDATE users SET password = ?, is_admin = 1, name = ? WHERE email = ?',
                    [hashed, name, email],
                    (err) => {
                        if (err) {
                            console.error('Update error:', err.message);
                        } else {
                            console.log(`Promoted ${email} to admin and reset its password.`);
                        }
                        db.end();
                    }
                );
            } else {
                db.query(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
                    [name, email, hashed],
                    (err) => {
                        if (err) {
                            console.error('Insert error:', err.message);
                        } else {
                            console.log(`Created admin user ${email}.`);
                        }
                        db.end();
                    }
                );
            }
        });
    } catch (e) {
        console.error('Unexpected error:', e.message);
        db.end();
        process.exit(1);
    }
});
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
