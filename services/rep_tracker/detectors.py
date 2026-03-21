import cv2
import json
import numpy as np
from typing import Dict, Any, Tuple
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


class PullUpDetector(BaseExerciseDetector):
    """
    Evaluates pull-up form using elbow joint angles and vertical
    shoulder-to-wrist displacement.

    Biomechanics:
      Hanging (rest):  elbows extended (~150-180°), shoulders far below wrists.
      Pulling (active): elbows flexed (<90°), shoulders rise toward wrist/bar level.

    A rep is: Hanging → Pulling → Hanging.
    """

    REST_STATE = "Hanging"
    ACTIVE_STATE = "Pulling"

    def __init__(self, config_path: str = "config.json"):
        super().__init__(config_path)

    def _avg_elbow_angle(self, keypoints: np.ndarray) -> float:
        l_sh = keypoints[self.kp_map["left_shoulder"]]
        r_sh = keypoints[self.kp_map["right_shoulder"]]
        l_el = keypoints[self.kp_map["left_elbow"]]
        r_el = keypoints[self.kp_map["right_elbow"]]
        l_wr = keypoints[self.kp_map["left_wrist"]]
        r_wr = keypoints[self.kp_map["right_wrist"]]

        l_angle = calculate_angle(l_sh, l_el, l_wr)
        r_angle = calculate_angle(r_sh, r_el, r_wr)
        angles = [a for a in [l_angle, r_angle] if a > 0]
        return sum(angles) / len(angles) if angles else 0.0

    def _shoulder_wrist_metrics(
        self, keypoints: np.ndarray
    ) -> Tuple[float, float]:
        """Returns (norm_displacement, torso_length).

        norm_displacement: vertical distance between shoulder midpoint and
        wrist midpoint, divided by torso length.  Higher = more hanging.
        """
        l_sh = keypoints[self.kp_map["left_shoulder"]]
        r_sh = keypoints[self.kp_map["right_shoulder"]]
        l_wr = keypoints[self.kp_map["left_wrist"]]
        r_wr = keypoints[self.kp_map["right_wrist"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]

        sh_mid = get_midpoint(l_sh, r_sh)
        wr_mid = get_midpoint(l_wr, r_wr)
        hip_mid = get_midpoint(l_hip, r_hip)

        torso_len = calculate_vertical_displacement(sh_mid, hip_mid)
        if torso_len <= 0:
            return 0.0, 0.0

        sh_wr_disp = sh_mid[1] - wr_mid[1]  # positive = shoulder below wrist
        return sh_wr_disp / torso_len, torso_len

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        l_sh = keypoints[self.kp_map["left_shoulder"]]
        r_sh = keypoints[self.kp_map["right_shoulder"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]

        sh_mid = get_midpoint(l_sh, r_sh)
        hip_mid = get_midpoint(l_hip, r_hip)
        torso_len = calculate_vertical_displacement(sh_mid, hip_mid)
        shoulder_width = abs(l_sh[0] - r_sh[0])

        if torso_len <= 0:
            return {"status": "Error", "view": "Unknown"}

        avg_elbow = self._avg_elbow_angle(keypoints)
        norm_disp, _ = self._shoulder_wrist_metrics(keypoints)

        facing_ratio = shoulder_width / torso_len
        if facing_ratio > 0.60:
            view = "Frontal"
        elif facing_ratio < 0.25:
            view = "Profile"
        else:
            view = "Oblique"

        # Primary signal: elbow angle.
        # Secondary confirmation: normalized shoulder-wrist displacement.
        status = self.REST_STATE

        if view == "Profile":
            if 0 < avg_elbow < 100:
                status = self.ACTIVE_STATE
        elif view == "Frontal":
            if 0 < avg_elbow < 100 or (0 < avg_elbow < 110 and norm_disp < 0.40):
                status = self.ACTIVE_STATE
        else:  # Oblique
            if 0 < avg_elbow < 100 or (0 < avg_elbow < 110 and norm_disp < 0.40):
                status = self.ACTIVE_STATE

        # Safety override: if elbows are very bent, it's a pull-up regardless
        if 0 < avg_elbow < 70:
            status = self.ACTIVE_STATE

        return {
            "view": view,
            "status": status,
            "elbow_angle": avg_elbow,
            "norm_disp": round(norm_disp, 3),
            "facing_ratio": round(facing_ratio, 3),
        }