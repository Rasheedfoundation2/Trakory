// config/db.js
require('dotenv').config();
const mysql = require('mysql2');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'intern_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Add SSL for cloud databases (TiDB Cloud, PlanetScale, etc.)
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: true,
    };
}

// Use connection pool for better performance in production
const db = mysql.createPool(dbConfig);

// Test connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        if (process.env.NODE_ENV === 'production') {
            console.error('⚠️ Running without database connection in production!');
        }
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

// Export promise-based pool for async/await usage and also the regular pool
module.exports = db;