import cv2
import numpy as np
from ultralytics import YOLO
from typing import Tuple, Dict, Any

class PoseEstimator:
    """
    A generic pose estimation handler using YOLOv8-Pose.
    Automatically handles bounding boxes and returns absolute pixel coordinates.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initializes the PoseEstimator. Automatically downloads the model 
        weights (yolov8n-pose.pt) on the first run.
        """
        self.model = YOLO('yolov8n-pose.pt')

    def extract_keypoints(self, image_path: str) -> Tuple[np.ndarray, np.ndarray, float, float]:
        """
        Runs inference to extract COCO keypoints from an image.

        Args:
            image_path (str): The file path to the target image.

        Returns:
            Tuple: 
                - img: The raw OpenCV image.
                - raw_keypoints: A [17, 2] numpy array of exact (x, y) pixel coordinates.
                - scale_x, scale_y: Set to 1.0 since YOLO outputs absolute coordinates natively.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image at {image_path}")
        
        # Run YOLO inference quietly
        results = self.model(img, verbose=False)
        
        # Ensure a person was detected
        if len(results[0].keypoints) == 0:
            raise ValueError("No person detected in the image.")
        
        # Extract the keypoints for the first detected person
        raw_keypoints = results[0].keypoints.xy[0].cpu().numpy() 
        
        return img, raw_keypoints, 1.0, 1.0