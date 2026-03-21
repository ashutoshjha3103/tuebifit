# tuebifit/Makefile

.PHONY: run-rep-tracker build-rep-tracker

# Runs the python script locally using your active venv
run-rep-tracker:
	cd services/rep_tracker && python main.py

# Builds the Docker container for the rep tracker
build-rep-tracker:
	cd services/rep_tracker && docker build -t tuebifit-rep-tracker .

# Runs the built Docker container locally
docker-run-rep-tracker:
	docker run --rm -v $(PWD)/services/rep_tracker:/app/data tuebifit-rep-tracker

# Future commands for your other services
run-frontend:
	cd frontend && npm run dev

run-all: run-frontend run-rep-tracker