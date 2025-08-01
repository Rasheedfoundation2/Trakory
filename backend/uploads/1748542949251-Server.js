// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');


// Import routes
const authRoutes = require('./routes/auth-routes');
const eventsRoutes = require('./routes/events-routes');
const timeTrackingRoutes = require('./routes/timeTracking-routes');
const filesRoutes = require('./routes/files-routes');
const usersRoutes = require('./routes/users-routes');
const chatRoutes = require('./routes/chat-routes');
const messageRoutes = require('./routes/messages');
const projectRoutes = require('./routes/project-routes');
const feedRoutes = require('./routes/feed-routes');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Import database connection (this will establish the connection)
require('./config/db');

// Routes
app.use('/', authRoutes);                 // Auth routes at root level
app.use('/api/events', eventsRoutes);     // Events routes
app.use('/api/timers', timeTrackingRoutes); // Time tracking routes
app.use('/api', filesRoutes);            // File management(user admin) routes
app.use('/api', usersRoutes);            // user routes for feed 
app.use('/api', chatRoutes);             // for the chat 
app.use('/api/messages', messageRoutes); // for messages 
app.use('/api', projectRoutes);          // for scrumboard
app.use('/api', feedRoutes);            // for feed 


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));