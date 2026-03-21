# detectors.py
import cv2
import json
import numpy as np
from typing import Dict, Any
from utils import get_midpoint, calculate_vertical_displacement

class BaseExerciseDetector:
    """
    A foundational class for rendering and processing generic exercise keypoints.
    Provides visualization utilities independent of specific exercise logic.
    """

    def __init__(self, config_path: str = "config.json"):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.kp_map = self.config["keypoints"]
        self.edges = self.config["skeleton_edges"]

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement evaluate_form")

    def draw_skeleton(self, img: np.ndarray, keypoints: np.ndarray, 
                      scale_x: float, scale_y: float, metrics_text: str = "") -> np.ndarray:
        """
        Draws the skeletal structure and optional metric overlays onto an image.
        """
        h, w = img.shape[:2]
        
        # Robust Scaling Check: Ensure keypoints map to the image regardless of ONNX output format
        max_val = np.max(keypoints)
        if max_val <= 1.0:
            # Model output is normalized (0.0 to 1.0)
            actual_scale_x = w
            actual_scale_y = h
        elif max_val > 300:
            # Model output is already in absolute image coordinates
            actual_scale_x = 1.0
            actual_scale_y = 1.0
        else:
            # Model output is relative to the 192x256 input tensor
            actual_scale_x = scale_x
            actual_scale_y = scale_y

        scaled_kps = {
            i: (int(kp[0] * actual_scale_x), int(kp[1] * actual_scale_y)) 
            for i, kp in enumerate(keypoints)
        }

        # Dynamic thickness based on image size so lines are always visible
        line_thickness = max(3, int(h / 150))
        circle_radius = max(5, int(h / 100))

        # Draw connecting skeleton lines (Cyan color for high contrast)
        for edge in self.edges:
            pt1 = scaled_kps.get(edge[0])
            pt2 = scaled_kps.get(edge[1])
            if pt1 and pt2:
                cv2.line(img, pt1, pt2, (255, 255, 0), line_thickness)

        # Draw joint nodes (Red color)
        for name, idx in self.kp_map.items():
            pt = scaled_kps.get(idx)
            if pt:
                cv2.circle(img, pt, circle_radius, (0, 0, 255), -1)

        # Draw metrics text in the BOTTOM LEFT corner
        if metrics_text:
            text_pos = (30, h - 40)
            # Draw a black outline first for readability against any background
            cv2.putText(img, metrics_text, text_pos, 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 5, cv2.LINE_AA)
            # Draw the white text over the outline
            cv2.putText(img, metrics_text, text_pos, 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        
        return img


class SquatDetector(BaseExerciseDetector):
    """
    A specialized detector for evaluating squat depth and form based on 
    normalized vertical pelvis displacement.
    """

    def __init__(self, config_path: str = "config.json"):
        super().__init__(config_path)

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        """
        Calculates the normalized pelvis drop ratio to determine squat depth.
        """
        l_shoulder = keypoints[self.kp_map["left_shoulder"]]
        r_shoulder = keypoints[self.kp_map["right_shoulder"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]
        l_ankle = keypoints[self.kp_map["left_ankle"]]
        r_ankle = keypoints[self.kp_map["right_ankle"]]

        shoulder_mid = get_midpoint(l_shoulder, r_shoulder)
        pelvis_mid = get_midpoint(l_hip, r_hip)
        ankle_mid = get_midpoint(l_ankle, r_ankle)

        torso_length = calculate_vertical_displacement(shoulder_mid, pelvis_mid)
        leg_extension = calculate_vertical_displacement(pelvis_mid, ankle_mid)

        if torso_length <= 0:
            return {"depth_ratio": 0.0, "status": "error", "torso_length": 0.0}

        depth_ratio = leg_extension / torso_length
        status = "Squatting" if depth_ratio < 0.85 else "Standing"

        return {
            "depth_ratio": depth_ratio,
            "status": status,
            "torso_length": torso_length 
        }