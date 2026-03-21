"""
Entry point for the exercise tracking microservice.
Orchestrates the ONNX inference pipeline and the specialized exercise detectors.
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

    metrics = detector.evaluate_form(raw_keypoints)
    
    display_text = f"Status: {metrics['status']} | Ratio: {metrics['depth_ratio']:.2f}"
    annotated_img = detector.draw_skeleton(img, raw_keypoints, scale_x, scale_y, display_text)
    
    # Create an output filename based on the input
    filename = os.path.basename(image_path)
    output_filename = f"annotated_{filename}"
    
    cv2.imwrite(output_filename, annotated_img)
    print(f"Success! Status: {metrics['status']} | Depth Ratio: {metrics['depth_ratio']:.2f}")
    print(f"Saved: {output_filename}")

def main():
    config_path = "config.json"
    detector = SquatDetector(config_path)
    estimator = PoseEstimator(detector.config)

    # Test both barbell squat images
    test_images = [
        "Barbel_full_squat_0.jpg", 
        "Barbel_full_squat_1.jpg"
    ]

    for img_path in test_images:
        process_image(img_path, detector, estimator)

if __name__ == "__main__":
    main()