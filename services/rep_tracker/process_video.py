"""
Process a video file through the full rep-tracking pipeline and produce
an annotated output video with skeleton overlay, rep count, and messages.

Usage:
    python process_video.py Squat_video.webm
    python process_video.py Pullup_video.webm --exercise pullup --target-reps 3
    python process_video.py input.mp4 --target-reps 10 --output out.mp4
"""
import argparse
import os
import sys
import time

import cv2

from inference import PoseEstimator
from detectors import SquatDetector, PullUpDetector, PushUpDetector, DeadliftDetector
from state_machine import RepCounter

EXERCISES = {
    "squat": {
        "detector_cls": SquatDetector,
        "rest_state": "Standing",
        "active_state": "Squatting",
        "entry_frames": 3,
        "exit_frames": 15,
    },
    "pullup": {
        "detector_cls": PullUpDetector,
        "rest_state": PullUpDetector.REST_STATE,
        "active_state": PullUpDetector.ACTIVE_STATE,
        "entry_frames": 3,
        "exit_frames": 15,
    },
    "pushup": {
        "detector_cls": PushUpDetector,
        "rest_state": PushUpDetector.REST_STATE,
        "active_state": PushUpDetector.ACTIVE_STATE,
        "entry_frames": 2,
        "exit_frames": 8,
    },
    "deadlift": {
        "detector_cls": DeadliftDetector,
        "rest_state": DeadliftDetector.REST_STATE,
        "active_state": DeadliftDetector.ACTIVE_STATE,
        "entry_frames": 3,
        "exit_frames": 12,
    },
}


def _draw_rep_counter(frame, keypoints, reps, target, message):
    """Draw a clean rep counter on the side of the frame away from the person."""
    h, w = frame.shape[:2]

    visible = keypoints[(keypoints[:, 0] > 0) | (keypoints[:, 1] > 0)]
    if len(visible) == 0:
        person_cx = w // 2
    else:
        person_cx = int(visible[:, 0].mean())

    margin = int(w * 0.06)
    panel_w = int(w * 0.22)
    panel_h = int(h * 0.22)
    panel_y = (h - panel_h) // 2

    if person_cx < w // 2:
        panel_x = w - panel_w - margin
    else:
        panel_x = margin

    overlay = frame.copy()
    cv2.rectangle(overlay, (panel_x, panel_y),
                  (panel_x + panel_w, panel_y + panel_h),
                  (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
    cv2.rectangle(frame, (panel_x, panel_y),
                  (panel_x + panel_w, panel_y + panel_h),
                  (0, 230, 118), 2)

    label = "Rep Count"
    label_scale = h / 1200.0
    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, label_scale, 1)[0]
    label_x = panel_x + (panel_w - label_size[0]) // 2
    label_y = panel_y + int(panel_h * 0.22)
    cv2.putText(frame, label, (label_x, label_y),
                cv2.FONT_HERSHEY_SIMPLEX, label_scale, (0, 230, 118), 1, cv2.LINE_AA)

    rep_str = str(reps)
    big_scale = h / 350.0
    big_size = cv2.getTextSize(rep_str, cv2.FONT_HERSHEY_SIMPLEX, big_scale, 3)[0]
    target_str = f"/{target}"
    small_scale = h / 800.0
    small_size = cv2.getTextSize(target_str, cv2.FONT_HERSHEY_SIMPLEX, small_scale, 2)[0]

    total_w = big_size[0] + small_size[0] + 2
    combo_x = panel_x + (panel_w - total_w) // 2
    combo_y = panel_y + int(panel_h * 0.65)

    cv2.putText(frame, rep_str, (combo_x, combo_y),
                cv2.FONT_HERSHEY_SIMPLEX, big_scale, (255, 255, 255), 3, cv2.LINE_AA)
    cv2.putText(frame, target_str, (combo_x + big_size[0] + 2, combo_y),
                cv2.FONT_HERSHEY_SIMPLEX, small_scale, (150, 160, 170), 2, cv2.LINE_AA)

    if message and message != "Let's go!":
        msg_scale = small_scale
        msg_thick = 2
        msg_size = cv2.getTextSize(message, cv2.FONT_HERSHEY_SIMPLEX, msg_scale, msg_thick)[0]
        if msg_size[0] > panel_w - 10:
            msg_scale = msg_scale * (panel_w - 10) / msg_size[0]
            msg_size = cv2.getTextSize(message, cv2.FONT_HERSHEY_SIMPLEX, msg_scale, msg_thick)[0]
        msg_x = panel_x + (panel_w - msg_size[0]) // 2
        msg_y = panel_y + int(panel_h * 0.88)
        cv2.putText(frame, message, (msg_x, msg_y),
                    cv2.FONT_HERSHEY_SIMPLEX, msg_scale, (0, 200, 255), msg_thick, cv2.LINE_AA)


def process_video(input_path: str, output_path: str,
                  exercise: str = "squat", target_reps: int = 15,
                  use_gpu: bool = False):
    cfg = EXERCISES[exercise]

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error: could not open {input_path}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Exercise: {exercise}")
    print(f"Input : {input_path}  ({w}x{h} @ {fps:.1f} fps, ~{total} frames)")
    print(f"Output: {output_path}")

    tmp_avi = output_path.rsplit(".", 1)[0] + "_tmp.avi"
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    writer = cv2.VideoWriter(tmp_avi, fourcc, fps, (w, h))
    if not writer.isOpened():
        print("Error: VideoWriter failed to open")
        sys.exit(1)

    estimator = PoseEstimator(static_image_mode=False, use_gpu=use_gpu)
    detector = cfg["detector_cls"]()
    # Scale hysteresis thresholds for low-fps inputs (GIFs, etc.)
    fps_scale = max(0.1, fps / 30.0)
    entry = max(1, int(cfg["entry_frames"] * fps_scale))
    exit_ = max(1, int(cfg["exit_frames"] * fps_scale))

    counter = RepCounter(
        target_reps=target_reps,
        rest_state=cfg["rest_state"],
        active_state=cfg["active_state"],
        entry_frames=entry,
        exit_frames=exit_,
    )

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

            annotated = detector.draw_skeleton(frame, keypoints, sx, sy, "")

            _draw_rep_counter(annotated, keypoints, rep_state["reps"],
                              target_reps, rep_state["message"])

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

    print("Converting to MP4...")
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
    parser.add_argument("--exercise", "-e", choices=EXERCISES.keys(), default="squat")
    parser.add_argument("--output", "-o", default=None, help="Output video path (default: annotated_<input>.mp4)")
    parser.add_argument("--target-reps", type=int, default=15)
    parser.add_argument("--gpu", action="store_true", help="Use GPU delegate if available")
    args = parser.parse_args()

    if args.output is None:
        base = os.path.splitext(os.path.basename(args.input))[0]
        args.output = f"annotated_{base}.mp4"

    process_video(args.input, args.output, args.exercise, args.target_reps, args.gpu)
