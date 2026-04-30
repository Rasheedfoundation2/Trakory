// server.js
const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

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
const taskBoardsRoutes = require('./routes/task-boards-routes');

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
app.use('/api/task-boards', taskBoardsRoutes);

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
