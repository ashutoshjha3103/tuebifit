"""
Process a video file through the full rep-tracking pipeline and produce
an annotated output video with skeleton overlay, rep count, and messages.

Usage:
    python process_video.py Squat_-_exercise_demonstration_video.webm
    python process_video.py input.mp4 --target-reps 10 --output out.mp4
"""
import argparse
import os
import sys
import time

import cv2
import numpy as np

from inference import PoseEstimator
from detectors import SquatDetector
from state_machine import RepCounter


def process_video(input_path: str, output_path: str, target_reps: int = 15):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error: could not open {input_path}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Input : {input_path}  ({w}x{h} @ {fps:.1f} fps, ~{total} frames)")
    print(f"Output: {output_path}")

    # Use MJPG in AVI as intermediate (universally supported by headless OpenCV)
    tmp_avi = output_path.rsplit(".", 1)[0] + "_tmp.avi"
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    writer = cv2.VideoWriter(tmp_avi, fourcc, fps, (w, h))
    if not writer.isOpened():
        print("Error: VideoWriter failed to open")
        sys.exit(1)

    estimator = PoseEstimator(static_image_mode=False)
    detector = SquatDetector("config.json")
    counter = RepCounter(target_reps=target_reps)

    frame_idx = 0
    skipped = 0
    t0 = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1

        try:
            _, keypoints, sx, sy = estimator.extract_keypoints_from_frame(frame)
            metrics = detector.evaluate_form(keypoints)
            rep_state = counter.update(metrics["status"])

            status_line = (
                f"[{metrics['view']}] {rep_state['confirmed_state']} | "
                f"Reps: {rep_state['reps']}/{target_reps}"
            )
            msg_line = rep_state["message"]

            annotated = detector.draw_skeleton(frame, keypoints, sx, sy, status_line)

            # Draw motivational message near top
            cv2.putText(annotated, msg_line, (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 5, cv2.LINE_AA)
            cv2.putText(annotated, msg_line, (30, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 128), 2, cv2.LINE_AA)

        except ValueError:
            annotated = frame
            skipped += 1

        writer.write(annotated)

        if frame_idx % 30 == 0 or frame_idx == total:
            elapsed = time.time() - t0
            pct = (frame_idx / total * 100) if total else 0
            print(f"  {frame_idx}/{total} frames ({pct:.0f}%) — {elapsed:.1f}s elapsed")

    cap.release()
    writer.release()
    estimator.close()

    elapsed = time.time() - t0
    print(f"\nProcessed {frame_idx} frames in {elapsed:.1f}s "
          f"({frame_idx/elapsed:.1f} fps), {skipped} skipped (no pose)")
    print(f"Final rep count: {counter.reps_completed}")

    # Convert MJPG AVI → MP4 with ffmpeg for smaller file & wider compatibility
    print(f"Converting to MP4...")
    ret = os.system(
        f'ffmpeg -y -loglevel warning -i "{tmp_avi}" '
        f'-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "{output_path}"'
    )
    if ret == 0 and os.path.exists(output_path):
        os.remove(tmp_avi)
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"Done: {output_path} ({size_mb:.1f} MB)")
    else:
        print(f"ffmpeg conversion failed; raw AVI kept at {tmp_avi}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process video through rep-tracker pipeline")
    parser.add_argument("input", help="Path to input video file")
    parser.add_argument("--output", "-o", default=None, help="Output video path (default: annotated_<input>.mp4)")
    parser.add_argument("--target-reps", type=int, default=15)
    args = parser.parse_args()

    if args.output is None:
        base = os.path.splitext(os.path.basename(args.input))[0]
        args.output = f"annotated_{base}.mp4"

    process_video(args.input, args.output, args.target_reps)
