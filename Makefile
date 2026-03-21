# tuebifit/Makefile

.PHONY: run-rep-tracker run-rep-server build-rep-tracker docker-run-rep-tracker run-frontend run-all

# CLI mode: process test images
run-rep-tracker:
	cd services/rep_tracker && python main.py

# Server mode: start the FastAPI + WebSocket server on port 8000
run-rep-server:
	cd services/rep_tracker && uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Docker
build-rep-tracker:
	cd services/rep_tracker && docker build -t tuebifit-rep-tracker .

docker-run-rep-tracker:
	docker run --rm -p 8000:8000 tuebifit-rep-tracker

# Frontend
run-frontend:
	cd frontend && npm run dev

run-all: run-frontend run-rep-server