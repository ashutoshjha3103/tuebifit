"""
CLI entry point for the exercise tracking microservice.

Usage:
  python main.py                        # process default test images
  python main.py img1.jpg img2.jpg      # process specific images
  python main.py --target-reps 10       # set a rep target for the sequence
"""
import argparse
import os
import sys

import cv2

from inference import PoseEstimator
from detectors import SquatDetector
from state_machine import RepCounter


def process_images(image_paths: list[str], target_reps: int = 15):
    config_path = "config.json"
    detector = SquatDetector(config_path)
    estimator = PoseEstimator(static_image_mode=True)
    counter = RepCounter(target_reps=target_reps)

    for image_path in image_paths:
        print(f"\nProcessing {image_path}...")

        if not os.path.exists(image_path):
            print(f"Error: {image_path} not found.")
            continue

        try:
            img, keypoints, sx, sy = estimator.extract_keypoints(image_path)
        except Exception as e:
            print(f"Failed to process image: {e}")
            continue

        metrics = detector.evaluate_form(keypoints)
        rep_state = counter.update(metrics["status"])

        display_text = (
            f"[{metrics['view']}] {metrics['status']} | "
            f"Reps: {rep_state['reps']} | {rep_state['message']}"
        )
        annotated = detector.draw_skeleton(img, keypoints, sx, sy, display_text)

        filename = os.path.basename(image_path)
        output_filename = f"annotated_{filename}"
        cv2.imwrite(output_filename, annotated)

        print(f"  View: {metrics['view']}  Status: {metrics['status']}")
        print(f"  Depth ratio: {metrics['depth_ratio']:.2f}  Knee angle: {metrics['knee_angle']:.0f}")
        print(f"  Reps: {rep_state['reps']}  {rep_state['message']}")
        print(f"  Saved: {output_filename}")

    estimator.close()


def main():
    parser = argparse.ArgumentParser(description="TuebiFit Rep Tracker CLI")
    parser.add_argument("images", nargs="*", default=["Barbel_full_squat_0.jpg", "Barbel_full_squat_1.jpg"])
    parser.add_argument("--target-reps", type=int, default=15)
    args = parser.parse_args()

    process_images(args.images, target_reps=args.target_reps)


if __name__ == "__main__":
    main()