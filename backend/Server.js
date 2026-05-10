// server.js
const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();

// CORS — explicit, with preflight + credentials. Allows Vercel deploys
// (any *.vercel.app), localhost dev, and anything in CORS_ORIGINS env.
const extraOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        // Non-browser requests (curl, server-to-server) have no Origin → allow.
        if (!origin) return callback(null, true);
        if (
            origin.endsWith('.vercel.app') ||
            origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            extraOrigins.includes(origin)
        ) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Health check — useful to verify the backend is awake before debugging auth.
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Import database connection
require('./config/db');

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Serve Vite static frontend
app.use(express.static(path.join(__dirname, 'dist'))); // 👈 Add this

// Routes
const authRoutes = require('./routes/auth-routes');
const eventsRoutes = require('./routes/events-routes');
const timeTrackingRoutes = require('./routes/timeTracking-routes');
const chatRoutes = require('./routes/chat-routes');
const projectRoutes = require('./routes/project-routes');
const feedRoutes = require('./routes/feed-routes');
const usersRoutes = require('./routes/users-routes');
const approvalsRoutes = require('./routes/approvals-routes');
const attendanceRoutes = require('./routes/attendance-routes');
const driveRoutes = require('./routes/drive-routes');
const projectsRoutes = require('./routes/projects-routes');
const userManagementRoutes = require('./routes/user-management-routes');

app.use('/', authRoutes);
app.use('/api', eventsRoutes);
app.use('/api/timers', timeTrackingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', projectRoutes);
app.use('/api', feedRoutes);
app.use('/api', usersRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/project_task', projectsRoutes);
app.use('/api/user-management', userManagementRoutes);

// 🔹 Catch-all: send index.html for client-side routing (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
