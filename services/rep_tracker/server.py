"""
FastAPI + WebSocket server for real-time squat rep tracking.

Protocol (client ↔ server over WebSocket):

  → Client sends JSON:
    {
      "frame": "<base64-encoded JPEG or PNG>",
      "target_reps": 15          // optional, only read on first frame or reset
    }

  ← Server responds JSON:
    {
      "status": "Squatting" | "Standing" | "Error",
      "view": "Frontal" | "Profile" | "Oblique" | "Unknown",
      "depth_ratio": 1.23,
      "knee_angle": 110.5,
      "facing_ratio": 0.45,
      "reps": 3,
      "message": "Good form, keep going.",
      "annotated_frame": "<base64-encoded JPEG>"   // optional, if ?annotate=true
    }

  → Client sends JSON to reset:
    { "command": "reset", "target_reps": 15 }
"""

import base64
import json
import logging
import os
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference import PoseEstimator
from detectors import SquatDetector
from state_machine import RepCounter

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rep_tracker")

CONFIG_PATH = os.getenv("CONFIG_PATH", "config.json")

# Shared singleton for the static-image health-check endpoint
_estimator: PoseEstimator | None = None
_detector: SquatDetector | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _estimator, _detector
    _detector = SquatDetector(CONFIG_PATH)
    _estimator = PoseEstimator(static_image_mode=True)
    log.info("Rep-tracker server started — MediaPipe BlazePose loaded")
    yield
    if _estimator:
        _estimator.close()
    log.info("Rep-tracker server shut down")


app = FastAPI(
    title="TuebiFit Rep Tracker",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model": "BlazePose", "complexity": 2}


def _decode_frame(b64: str) -> np.ndarray:
    """Decode a base64-encoded image string into a BGR numpy frame."""
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Failed to decode base64 frame into an image")
    return frame


def _encode_frame(frame: np.ndarray) -> str:
    """Encode a BGR numpy frame as a base64 JPEG string."""
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return base64.b64encode(buf).decode("ascii")


@app.websocket("/ws")
async def ws_rep_tracker(websocket: WebSocket, annotate: bool = Query(False)):
    await websocket.accept()

    # Per-connection pipeline: dedicated estimator in video-tracking mode
    estimator = PoseEstimator(static_image_mode=False)
    detector = SquatDetector(CONFIG_PATH)
    counter = RepCounter(target_reps=15)

    log.info("WebSocket connection opened")

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)

            # Handle reset command
            if data.get("command") == "reset":
                target = data.get("target_reps", 15)
                counter = RepCounter(target_reps=target)
                await websocket.send_json({"reps": 0, "message": "Let's go!", "status": "reset"})
                continue

            # On first meaningful message, allow overriding target_reps
            if counter.reps_completed == 0 and "target_reps" in data:
                counter.target_reps = int(data["target_reps"])

            b64_frame = data.get("frame")
            if not b64_frame:
                await websocket.send_json({"error": "missing 'frame' field"})
                continue

            try:
                frame = _decode_frame(b64_frame)
                _, keypoints, sx, sy = estimator.extract_keypoints_from_frame(frame)
            except ValueError as e:
                await websocket.send_json({"error": str(e)})
                continue

            metrics = detector.evaluate_form(keypoints)
            rep_state = counter.update(metrics["status"])

            response = {
                "status": rep_state["confirmed_state"],
                "raw_status": metrics["status"],
                "view": metrics["view"],
                "depth_ratio": round(metrics["depth_ratio"], 3),
                "knee_angle": round(metrics["knee_angle"], 1),
                "facing_ratio": round(metrics["facing_ratio"], 3),
                "reps": rep_state["reps"],
                "message": rep_state["message"],
            }

            if annotate:
                display_text = (
                    f"[{metrics['view']}] {rep_state['confirmed_state']} | "
                    f"Reps: {rep_state['reps']} | {rep_state['message']}"
                )
                annotated = detector.draw_skeleton(frame.copy(), keypoints, sx, sy, display_text)
                response["annotated_frame"] = _encode_frame(annotated)

            await websocket.send_json(response)

    except WebSocketDisconnect:
        log.info("WebSocket connection closed by client")
    except Exception as exc:
        log.exception("Unexpected error in WebSocket handler")
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass
    finally:
        estimator.close()


@app.post("/analyze")
async def analyze_frame(payload: dict):
    """
    One-shot REST endpoint for testing.
    Accepts { "frame": "<base64>" } and returns metrics (no rep counting).
    """
    b64 = payload.get("frame")
    if not b64:
        return JSONResponse({"error": "missing 'frame' field"}, status_code=400)

    try:
        frame = _decode_frame(b64)
        _, keypoints, _, _ = _estimator.extract_keypoints_from_frame(frame)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=422)

    metrics = _detector.evaluate_form(keypoints)
    return {
        "status": metrics["status"],
        "view": metrics["view"],
        "depth_ratio": round(metrics["depth_ratio"], 3),
        "knee_angle": round(metrics["knee_angle"], 1),
        "facing_ratio": round(metrics["facing_ratio"], 3),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
