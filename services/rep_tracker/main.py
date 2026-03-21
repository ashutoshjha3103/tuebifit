from inference import PoseEstimator
from detectors import SquatDetector
from state_machine import RepCounter
import cv2
import os

def main():
    detector = SquatDetector("config.json")
    estimator = PoseEstimator()
    rep_counter = RepCounter(target_reps=3) # Small target for testing

    # Simulating a video sequence: Standing -> Squatting -> Standing
    video_sequence = [
        "Barbel_full_squat_0.jpg", # Frame 1: Standing
        "Barbel_full_squat_1.jpg", # Frame 2: Squatting
        "Barbel_full_squat_0.jpg"  # Frame 3: Standing (Completes the rep!)
    ]

    for i, img_path in enumerate(video_sequence):
        print(f"\n--- Frame {i+1}: Processing {img_path} ---")
        
        # 1. Inference
        img, raw_keypoints, scale_x, scale_y = estimator.extract_keypoints(img_path)
        
        # 2. Evaluate Form
        metrics = detector.evaluate_form(raw_keypoints)
        status = metrics['status']
        
        # 3. Update State Machine
        state_data = rep_counter.update(status)
        reps = state_data["reps"]
        msg = state_data["message"]
        
        # 4. Draw Overlay
        display_text = f"[{metrics['view']}] {status} | Ang: {metrics['knee_angle']:.0f}"
        ui_text = f"Reps: {reps} | {msg}"
        
        annotated_img = detector.draw_skeleton(img, raw_keypoints, scale_x, scale_y, display_text)
        
        # Add the Rep Counter UI to the top left
        cv2.putText(annotated_img, ui_text, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3, cv2.LINE_AA)
        
        # Save output
        output_filename = f"frame_{i+1}_output.jpg"
        cv2.imwrite(output_filename, annotated_img)
        print(f"Result -> Status: {status} | Reps: {reps} | Msg: {msg}")

if __name__ == "__main__":
    main()