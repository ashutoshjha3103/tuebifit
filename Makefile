# tuebifit/Makefile

.PHONY: run-rep-tracker run-rep-server build-rep-tracker docker-run-rep-tracker \
        run-frontend run-all build-nutrition-mcp run-exercise-nutrition-mcp

# ── MCP servers ─────────────────────────────────────────────────────
NUTRITION_MCP_DIR := services/nutrition_mcp/mcp-opennutrition

build-nutrition-mcp:
	cd $(NUTRITION_MCP_DIR) && npm install && npm run build

# ── Rep tracker ─────────────────────────────────────────────────────
# Usage: make run-rep-tracker VIDEO=path/to/video.mp4 [EXERCISE=squat] [TARGET_REPS=15] [OUTPUT=out.mp4]
VIDEO       ?=
EXERCISE    ?= squat
TARGET_REPS ?= 15
OUTPUT      ?=

run-rep-tracker:
ifndef VIDEO
	$(error VIDEO is required. Usage: make run-rep-tracker VIDEO=path/to/video.mp4)
endif
	python services/rep_tracker/process_video.py "$(VIDEO)" \
		--exercise $(EXERCISE) \
		--target-reps $(TARGET_REPS) \
		$(if $(OUTPUT),--output "$(OUTPUT)",)

# Server mode: start the FastAPI + WebSocket server on port 8000
run-rep-server:
	cd services/rep_tracker && uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# ── Exercise + Nutrition MCP agent ──────────────────────────────────
# Usage: make run-exercise-nutrition-mcp [PROMPT="your question here"]
PROMPT ?=

run-exercise-nutrition-mcp:
	python services/featherless_demo.py $(if $(PROMPT),"$(PROMPT)",)

# ── Docker ──────────────────────────────────────────────────────────
build-rep-tracker:
	cd services/rep_tracker && docker build -t tuebifit-rep-tracker .

docker-run-rep-tracker:
	docker run --rm -p 8000:8000 tuebifit-rep-tracker

# ── Frontend ────────────────────────────────────────────────────────
run-frontend:
	cd frontend && npm run dev

run-all: run-frontend run-rep-server