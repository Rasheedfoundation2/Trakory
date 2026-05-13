# Deploying Task Boards

The Task Boards tool is a single Node service that bundles its own SQLite
database and serves the UI. Pick whichever host you have an account with.

## Option A — Render (one click, recommended)

1. Push this repo to GitHub (already done on branch `claude/task-management-tool-GX3YC`).
2. Go to https://render.com → **New +** → **Blueprint**.
3. Point it at this repo / branch. Render reads `render.yaml` automatically.
4. Click **Apply**. First deploy takes ~2 minutes.
5. Open the public URL Render gives you — the Task Boards UI loads at `/`.

The persistent disk in `render.yaml` keeps `task_boards.db` between deploys.

## Option B — Railway

1. https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Select this repo and branch.
3. Set the root directory to `backend`.
4. Set the start command to `node task-boards-server.js`.
5. Add a volume mounted at `/app/data` so the SQLite file survives restarts.
6. Deploy. Railway exposes a public URL automatically.

## Option C — Fly.io (Docker)

```sh
cd backend
fly launch        # accept the Dockerfile
fly volumes create task_boards_data --size 1
fly deploy
```

Mount the volume at `/app/data` in `fly.toml`:

```toml
[mounts]
    source = "task_boards_data"
    destination = "/app/data"
```

## Option D — Run anywhere with Docker

```sh
cd backend
docker build -t task-boards .
docker run -p 8080:8080 -v $(pwd)/data:/app/data task-boards
# open http://localhost:8080
```

## Option E — Just run it locally

```sh
cd backend
npm install
node task-boards-server.js
# open http://localhost:5050
```

## What gets deployed

- One Node process (`backend/task-boards-server.js`) on a single port.
- Serves the UI from `backend/public/index.html` at `/`.
- API at `/api/task-boards/*`.
- SQLite database file at `backend/data/task_boards.db` (auto-created, seeded with a sample board on first run).
- No MySQL, no extra services, no auth setup needed for internal use.
