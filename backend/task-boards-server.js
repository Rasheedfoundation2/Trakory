// Standalone server for the Task Boards tool.
// Runs the new tool independently so it does not depend on MySQL or the rest
// of the Trakory backend. Mounts the API + serves the static frontend build.

const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const taskBoardsRoutes = require('./routes/task-boards-routes');
app.use('/api/task-boards', taskBoardsRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.TASK_BOARDS_PORT || 5050;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Task Boards API running on http://localhost:${PORT}`);
});
