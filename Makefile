# tuebifit/Makefile

VENV_DIR   := .venv
PYTHON     := $(VENV_DIR)/bin/python
PIP        := $(VENV_DIR)/bin/pip

.PHONY: run-rep-tracker run-rep-server build-rep-tracker docker-run-rep-tracker \
        run-frontend run-all build-nutrition-mcp run-exercise-nutrition-mcp \
        setup-venv clean-venv

# ── Virtual environment ─────────────────────────────────────────────
setup-venv: $(VENV_DIR)/.installed

$(VENV_DIR)/.installed: services/requirements.txt services/rep_tracker/requirements.txt
	python3 -m venv $(VENV_DIR)
	$(PIP) install --upgrade pip
	$(PIP) install -r services/requirements.txt
	$(PIP) install -r services/rep_tracker/requirements.txt
	touch $@

clean-venv:
	rm -rf $(VENV_DIR)

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

run-rep-tracker: setup-venv
ifndef VIDEO
	$(error VIDEO is required. Usage: make run-rep-tracker VIDEO=path/to/video.mp4)
endif
	$(PYTHON) services/rep_tracker/process_video.py "$(VIDEO)" \
		--exercise $(EXERCISE) \
		--target-reps $(TARGET_REPS) \
		$(if $(OUTPUT),--output "$(OUTPUT)",)

# Server mode: start the FastAPI + WebSocket server on port 8000
run-rep-server: setup-venv
	cd services/rep_tracker && ../../$(VENV_DIR)/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# ── Exercise + Nutrition MCP agent ──────────────────────────────────
# Usage: make run-exercise-nutrition-mcp [PROMPT="your question here"]
PROMPT ?=

run-exercise-nutrition-mcp: setup-venv
	$(PYTHON) services/featherless_demo.py $(if $(PROMPT),"$(PROMPT)",)

# ── Docker ──────────────────────────────────────────────────────────
build-rep-tracker:
	cd services/rep_tracker && docker build -t tuebifit-rep-tracker .

docker-run-rep-tracker:
	docker run --rm -p 8000:8000 tuebifit-rep-tracker

# ── API server ──────────────────────────────────────────────────────
run-api: setup-venv
	cd services && ../$(VENV_DIR)/bin/python -m uvicorn api_server:app --host 0.0.0.0 --port 8001 --reload

# ── Frontend ────────────────────────────────────────────────────────
run-frontend:
	cd frontend && npm run dev

run-all: run-frontend run-api run-rep-server