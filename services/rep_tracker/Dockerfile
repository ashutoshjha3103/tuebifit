# services/rep_tracker/Dockerfile

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY config.json utils.py inference.py detectors.py main.py ./

# Download the ONNX model during the build phase
# We run a python one-liner to trigger the download logic in inference.py
RUN python -c "from inference import PoseEstimator; import json; \
    config = json.load(open('config.json')); PoseEstimator(config)"

# For now, this just runs the script. Later, this will start your FastAPI server.
CMD ["python", "main.py"]