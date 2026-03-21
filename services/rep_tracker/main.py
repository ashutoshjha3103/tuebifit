"""
Entry point for the exercise tracking microservice.
"""
from inference import PoseEstimator
from detectors import SquatDetector
import cv2
import os

def process_image(image_path: str, detector: SquatDetector, estimator: PoseEstimator):
    """Processes a single image and saves the annotated output."""
    print(f"\nProcessing {image_path}...")
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    try:
        img, raw_keypoints, scale_x, scale_y = estimator.extract_keypoints(image_path)
    except Exception as e:
        print(f"Failed to process image: {e}")
        return

    # Evaluate biomechanics
    metrics = detector.evaluate_form(raw_keypoints)
    
    # Overlay the results
    display_text = f"[{metrics['view']}] {metrics['status']} | Ratio: {metrics['depth_ratio']:.2f} | Ang: {metrics['knee_angle']:.0f}"
    annotated_img = detector.draw_skeleton(img, raw_keypoints, scale_x, scale_y, display_text)
    
    # Save the output
    filename = os.path.basename(image_path)
    output_filename = f"annotated_{filename}"
    cv2.imwrite(output_filename, annotated_img)
    
    print(f"Success! View: {metrics['view']} | Status: {metrics['status']}")
    print(f"Saved: {output_filename}")

def main():
    config_path = "config.json"
    detector = SquatDetector(config_path)
    estimator = PoseEstimator() # Config not strictly needed for YOLO default

    test_images = [
        "Barbel_full_squat_0.jpg", 
        "Barbel_full_squat_1.jpg"
    ]

    for img_path in test_images:
        process_image(img_path, detector, estimator)

if __name__ == "__main__":
    main()