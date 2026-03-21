import cv2
import json
import numpy as np
from typing import Dict, Any
from utils import get_midpoint, calculate_vertical_displacement, calculate_angle

class BaseExerciseDetector:
    """
    Foundational class for rendering exercise keypoints.
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
        """Draws the skeletal structure and metric overlays onto an image."""
        h, w = img.shape[:2]
        line_thickness = max(3, int(h / 150))
        circle_radius = max(5, int(h / 100))

        # Draw connecting lines
        for edge in self.edges:
            pt1 = (int(keypoints[edge[0]][0]), int(keypoints[edge[0]][1]))
            pt2 = (int(keypoints[edge[1]][0]), int(keypoints[edge[1]][1]))
            
            # Skip drawing if YOLO couldn't confidently find the point (returns 0,0)
            if pt1 != (0, 0) and pt2 != (0, 0):
                cv2.line(img, pt1, pt2, (255, 255, 0), line_thickness)

        # Draw joints
        for name, idx in self.kp_map.items():
            pt = (int(keypoints[idx][0]), int(keypoints[idx][1]))
            if pt != (0, 0):
                cv2.circle(img, pt, circle_radius, (0, 0, 255), -1)

        # Draw metrics text
        if metrics_text:
            text_pos = (30, h - 40)
            cv2.putText(img, metrics_text, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 5, cv2.LINE_AA)
            cv2.putText(img, metrics_text, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
        
        return img


class SquatDetector(BaseExerciseDetector):
    """
    Evaluates squat form using a view-aware blended logic system.
    Dynamically weighs joint angles vs. vertical displacement based on camera perspective.
    """
    def __init__(self, config_path: str = "config.json"):
        super().__init__(config_path)

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        # 1. Extract Keypoints
        l_shoulder = keypoints[self.kp_map["left_shoulder"]]
        r_shoulder = keypoints[self.kp_map["right_shoulder"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]
        l_knee = keypoints[self.kp_map["left_knee"]]
        l_ankle = keypoints[self.kp_map["left_ankle"]]
        r_knee = keypoints[self.kp_map["right_knee"]]
        r_ankle = keypoints[self.kp_map["right_ankle"]]

        # 2. Calculate Segments
        shoulder_mid = get_midpoint(l_shoulder, r_shoulder)
        pelvis_mid = get_midpoint(l_hip, r_hip)
        ankle_mid = get_midpoint(l_ankle, r_ankle)

        torso_len = calculate_vertical_displacement(shoulder_mid, pelvis_mid)
        leg_ext = calculate_vertical_displacement(pelvis_mid, ankle_mid)
        shoulder_width = abs(l_shoulder[0] - r_shoulder[0])

        if torso_len <= 0:
            return {"status": "Error", "view": "Unknown"}

        # 3. Calculate Core Metrics
        depth_ratio = leg_ext / torso_len
        
        l_angle = calculate_angle(l_hip, l_knee, l_ankle)
        r_angle = calculate_angle(r_hip, r_knee, r_ankle)
        angles = [a for a in [l_angle, r_angle] if a > 0]
        avg_knee_angle = sum(angles) / len(angles) if angles else 0.0

        # 4. Determine Camera Perspective (Tuned Thresholds)
        facing_ratio = shoulder_width / torso_len
        if facing_ratio > 0.60:       # Stricter frontal requirement
            view = "Frontal"
        elif facing_ratio < 0.25:     # Slightly looser profile requirement
            view = "Profile"
        else:
            view = "Oblique"

        # 5. Dynamic Blended Logic (Weighted)
        status = "Standing"
        
        if view == "Frontal":
            # Primary: Displacement (< 0.90)
            # Override: If they hit a deep angle (< 105), it's a squat regardless of 2D foreshortening.
            if depth_ratio < 0.90 or (0 < avg_knee_angle < 105):
                status = "Squatting"
                
        elif view == "Profile":
            # Primary: Angle (< 115)
            if 0 < avg_knee_angle < 115:
                status = "Squatting"
                
        else: # Oblique
            # Blended: Needs a decent drop in both
            if depth_ratio < 1.15 and 0 < avg_knee_angle < 115:
                status = "Squatting"

        return {
            "view": view,
            "status": status,
            "depth_ratio": depth_ratio,
            "knee_angle": avg_knee_angle,
            "facing_ratio": facing_ratio
        }