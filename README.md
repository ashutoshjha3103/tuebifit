# TuebiFit

A mobile-first fitness companion built at the **Cursor Hackathon 2026**. TuebiFit combines real-time exercise rep tracking, AI-powered workout and nutrition planning, and a modern React frontend into a single, cohesive platform.


<p align="center">
  <!-- GitHub strips HTML <video> in README.md, so it won’t show on github.com (only in some local previews). -->
  <a href="https://github.com/ashutoshjha3103/tuebifit/blob/main/assets/TueBiFit%20-%2022%20March%202026.mp4">
    <img
      src="https://img.shields.io/badge/▶_Play%20demo-Watch%20MP4%20on%20GitHub-00e676?style=for-the-badge&labelColor=0a1929"
      alt="Play TueBiFit demo video"
    />
  </a>
</p>

---

## Features

- **Exercise & Nutrition Agent** — An LLM-powered agent (Featherless API) that calls **Exercise DB** and **OpenNutrition** MCP servers to build personalized plans. Default generated plans: **3 workout days** (unless the user asks otherwise), **2 days of meals**, with **2–3 foods per meal** (breakfast, lunch, dinner) where tool data allows.
- **RepCount (in-app)** — Browse annotated demonstration videos (squat, deadlift, pull-up) with on-screen rep counts and form cues; uses pre-rendered clips from `assets/` (live camera pipeline is optional for future work).
- **Rep Tracker (CLI / scripts)** — Process a video file and produce an annotated output with skeleton overlay, rep counting, and form feedback. Supports squats, pull-ups, push-ups, and deadlifts.
- **Mobile Frontend** — React + Vite SPA with swipe navigation, **Workouts**, **Nutrition**, **RepCount**, and **Profile** tabs.

## Built With

This project was made possible by the generous sponsors of the Cursor Hackathon 2026:

| Sponsor | How we used it |
|---------|---------------|
| [Cursor](https://cursor.com) | **Title Sponsor** — Our primary development environment for the entire project |
| [Featherless AI](https://featherless.ai) | Powers our LLM agent backend — all workout and nutrition planning runs through the Featherless inference API |
| [LangChain](https://langchain.com) | Agent orchestration layer — LangChain, LangGraph, and MCP adapters connect our LLM to the exercise and nutrition databases |
| [Google](https://ai.google.dev/edge/mediapipe) | MediaPipe (Google) provides the BlazePose model that powers real-time pose estimation in the rep tracker |
| [Google Cloud](https://cloud.google.com/run) | **Production hosting** — full stack (built React static assets + FastAPI + MCP subprocesses) runs in a single **Cloud Run** container built from the repo `Dockerfile` |

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 20+ |
| npm | 9+ |
| ffmpeg | any (for video encoding) |

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ashutoshjha3103/tuebifit.git
cd tuebifit
```

### 2. Set up the Python environment

Creates a virtual environment and installs all Python dependencies for the rep tracker and the AI agent:

```bash
make setup-venv
```

### 3. Build the Nutrition MCP server

The OpenNutrition MCP server needs its npm dependencies installed and its dataset (326k foods) converted to SQLite:

```bash
make build-nutrition-mcp
```

### 4. Configure environment variables

Create a `.env` file in `services/`:

```bash
FEATHERLESS_API_KEY=your_api_key_here
FEATHERLESS_MODEL=moonshotai/Kimi-K2-Thinking        # optional, this is the default
FEATHERLESS_FORMAT_MODEL=Qwen/Qwen3-32B               # optional, this is the default
```

### 5. Install the frontend

```bash
cd frontend && npm install
```

## Usage

### Rep Tracker — Process a video

```bash
# Basic (squat is the default exercise)
make run-rep-tracker VIDEO=path/to/video.mp4

# With options
make run-rep-tracker VIDEO=path/to/video.mp4 EXERCISE=pullup TARGET_REPS=10 OUTPUT=result.mp4
```

Supported exercises: `squat`, `pullup`, `pushup`, `deadlift`

### Exercise & Nutrition Agent

```bash
# With default prompt
make run-exercise-nutrition-mcp

# With a custom prompt
make run-exercise-nutrition-mcp PROMPT="Build me a 3-day push/pull/legs split with high-protein meal suggestions"
```

### Rep Tracker Server (WebSocket)

```bash
make run-rep-server
```

Starts a FastAPI + WebSocket server on `http://localhost:8000` for real-time pose estimation from a live video feed.

### Frontend

```bash
make run-frontend
```

Starts the Vite dev server for the React app (default dev port is set in `frontend/vite.config.js`; API calls are proxied to the backend when you run `make run-api` on port `8001`).

### Backend API (plan generation — local dev)

```bash
make run-api
```

Runs `uvicorn` for `services/api_server.py` (default **8001**). The React app’s `/api` proxy targets this in development. In **Cloud Run**, the same app serves the built frontend from `frontend/dist`.

### Docker

**Rep tracker only** (separate image via Makefile):

```bash
make build-rep-tracker       # Build the image
make docker-run-rep-tracker  # Run on port 8000
```

**Full stack** (same image as Cloud Run — from repository root):

```bash
docker build -t tuebifit .
docker run --rm -p 8080:8080 -e FEATHERLESS_API_KEY=... tuebifit
```

## Dependencies

### Python

| Package | Purpose |
|---------|---------|
| mediapipe | Pose estimation (BlazePose) via Google MediaPipe |
| opencv-python-headless | Video I/O and frame annotation |
| numpy | Keypoint math |
| fastapi / uvicorn | WebSocket server for live tracking |
| langchain / langgraph | Agent orchestration via LangChain |
| langchain-mcp-adapters | MCP tool integration |
| python-dotenv | Environment variable management |

### Node.js

| Package | Purpose |
|---------|---------|
| @modelcontextprotocol/sdk | MCP server framework |
| better-sqlite3 | SQLite database for nutrition data |
| zod | Schema validation |

### Frontend

| Package | Purpose |
|---------|---------|
| react / react-dom | UI framework |
| react-router-dom | Client-side routing |
| react-swipeable | Touch/swipe gestures |
| lucide-react | Icons |
| vite | Build tooling |

## Deployment

### Google Cloud Run (recommended — full stack)

The root **`Dockerfile`** builds:

1. **Frontend** (`npm run build`) and copies `dist` into the image  
2. **MCP servers** (Exercise DB + OpenNutrition)  
3. **Python** runtime with `uvicorn` serving FastAPI and the static SPA

The container listens on **`PORT`** (defaults to **8080** in the image). Set secrets / env vars in Cloud Run for at least:

- `FEATHERLESS_API_KEY` (required for plan generation)

Optional overrides (see `services/.env` for local dev):

- `FEATHERLESS_MODEL`, `FEATHERLESS_FORMAT_MODEL`
- `MCP_OPENNUTRITION_PATH`, `MCP_EXERCISEDB_PATH` (usually leave as Dockerfile defaults)
- `DIST_DIR` (usually `/app/frontend/dist`)

Example (adjust project, region, and service name):

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/tuebifit
gcloud run deploy tuebifit \
  --image gcr.io/PROJECT_ID/tuebifit \
  --region REGION \
  --set-secrets FEATHERLESS_API_KEY=featherless-key:latest \
  --allow-unauthenticated
```

### Rep Tracker on Hugging Face (optional)

The standalone Gradio rep-tracker space can still use a `packages.txt` with system libraries, e.g.:

```
libgl1
libgles2
libegl1
ffmpeg
```

The `pose_landmarker_heavy.task` model file (~29 MB) should be tracked with **Git LFS** if you host that Space from this repo.

## License

This project is licensed under the [MIT License](LICENSE).

The OpenNutrition dataset is licensed under [ODbL](services/nutrition_mcp/mcp-opennutrition/data/LICENSE-ODbL.txt) / [DbCL](services/nutrition_mcp/mcp-opennutrition/data/LICENSE-DbCL.txt).

## Contributors

| Name | GitHub |
|------|--------|
| Ashutosh Jha | [@ashutoshjha3103](https://github.com/ashutoshjha3103) |
| Sarthak Bhardwaj | [@Bhardwaj-Sarthak](https://github.com/Bhardwaj-Sarthak) |
