# TuebiFit

A mobile-first fitness companion built at the **Cursor Hackathon 2026**. TuebiFit combines real-time exercise rep tracking, AI-powered workout and nutrition planning, and a modern React frontend into a single, cohesive platform.

<!-- Replace the placeholder below with a link to your demo video or GIF -->
<p align="center">
  <em>Demo video coming soon</em>
  <!-- <video src="assets/demo.mp4" width="300" controls></video> -->
  <!-- or use a GIF: -->
  <!-- <img src="assets/demo.gif" width="300" alt="TuebiFit demo" /> -->
</p>

---

## Features

- **Exercise & Nutrition Agent** — An LLM-powered agent that queries exercise and nutrition databases through MCP servers to build personalized workout plans and meal suggestions.
- **Rep Tracker** — Upload an exercise video and get an annotated output with skeleton overlay, real-time rep counting, and form feedback. Supports squats, pull-ups, push-ups, and deadlifts.
- **Mobile Frontend** — A React + Vite single-page app with swipe navigation, designed for mobile-first use.

## Built With

This project was made possible by the generous sponsors of the Cursor Hackathon 2026:

| Sponsor | How we used it |
|---------|---------------|
| [Cursor](https://cursor.com) | **Title Sponsor** — Our primary development environment for the entire project |
| [Featherless AI](https://featherless.ai) | Powers our LLM agent backend — all workout and nutrition planning runs through the Featherless inference API |
| [LangChain](https://langchain.com) | Agent orchestration layer — LangChain, LangGraph, and MCP adapters connect our LLM to the exercise and nutrition databases |
| [Google](https://ai.google.dev/edge/mediapipe) | MediaPipe (Google) provides the BlazePose model that powers real-time pose estimation in the rep tracker |
| [Vercel](https://vercel.com) | Frontend deployment — the React app is hosted on Vercel |

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

Starts the Vite dev server for the React app.

### Docker

```bash
make build-rep-tracker       # Build the image
make docker-run-rep-tracker  # Run on port 8000
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

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Rep Tracker | [Hugging Face Spaces](https://huggingface.co/spaces) (Gradio) |

For the Hugging Face Space, add a `packages.txt` with the required system libraries:

```
libgl1
libgles2
libegl1
ffmpeg
```

The `pose_landmarker_heavy.task` model file (~29 MB) must be uploaded via Git LFS.

## License

This project is licensed under the [MIT License](LICENSE).

The OpenNutrition dataset is licensed under [ODbL](services/nutrition_mcp/mcp-opennutrition/data/LICENSE-ODbL.txt) / [DbCL](services/nutrition_mcp/mcp-opennutrition/data/LICENSE-DbCL.txt).

## Contributors

| Name | GitHub |
|------|--------|
| Ashutosh Jha | [@ashutoshjha3103](https://github.com/ashutoshjha3103) |
| Sarthak Bhardwaj | [@Bhardwaj-Sarthak](https://github.com/Bhardwaj-Sarthak) |
