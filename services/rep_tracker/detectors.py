import math

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


class PushUpDetector(BaseExerciseDetector):
    """
    Evaluates push-up form using elbow angle and head drop.

    Biomechanics (person is horizontal):
      Up  (rest):   arms extended, head level with hips, nose close to hip height.
      Down (active): elbows bent (<100°), head drops well below hip plane.

    Primary signal: average elbow angle (shoulder-elbow-wrist).
    Secondary signal: nose-to-hip vertical gap normalized by upper-arm length.
      This is camera-independent — it measures how far the nose has dropped
      relative to the hips using a stable body-length reference.

    A rep is: Up → Down → Up.
    """

    REST_STATE = "Up"
    ACTIVE_STATE = "Down"

    def __init__(self, config_path: str = "config.json"):
        super().__init__(config_path)

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        l_sh = keypoints[self.kp_map["left_shoulder"]]
        r_sh = keypoints[self.kp_map["right_shoulder"]]
        l_el = keypoints[self.kp_map["left_elbow"]]
        r_el = keypoints[self.kp_map["right_elbow"]]
        l_wr = keypoints[self.kp_map["left_wrist"]]
        r_wr = keypoints[self.kp_map["right_wrist"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]
        nose = keypoints[self.kp_map["nose"]]

        # Elbow angle (shoulder-elbow-wrist)
        l_angle = calculate_angle(l_sh, l_el, l_wr)
        r_angle = calculate_angle(r_sh, r_el, r_wr)
        angles = [a for a in [l_angle, r_angle] if a > 0]
        avg_elbow = sum(angles) / len(angles) if angles else 0.0

        # Upper arm length (stable body reference for normalization)
        upper_arms = []
        for sh, el in [(l_sh, l_el), (r_sh, r_el)]:
            if sh[0] > 0 and el[0] > 0:
                upper_arms.append(math.sqrt((sh[0]-el[0])**2 + (sh[1]-el[1])**2))
        ua_len = sum(upper_arms) / len(upper_arms) if upper_arms else 1.0

        # Nose-to-hip gap: how far the nose has dropped below the hip plane,
        # normalized by upper arm length.  Higher = deeper push-up.
        hip_mid = get_midpoint(l_hip, r_hip)
        nose_hip_gap = nose[1] - hip_mid[1]  # positive = nose below hips (Y down)
        norm_nose_drop = nose_hip_gap / ua_len if ua_len > 0 else 0.0

        # View detection (same facing-ratio scheme)
        sh_mid = get_midpoint(l_sh, r_sh)
        torso_vert = calculate_vertical_displacement(sh_mid, hip_mid)
        shoulder_width = abs(l_sh[0] - r_sh[0])
        facing_ratio = shoulder_width / torso_vert if torso_vert > 0 else 0.0

        if facing_ratio > 0.60:
            view = "Frontal"
        elif facing_ratio < 0.25:
            view = "Profile"
        else:
            view = "Oblique"

        # Combined threshold:
        #   "Down" requires BOTH bent elbows AND a visible head drop.
        #   Safety override at very high nose drop (regardless of elbow noise).
        status = self.REST_STATE

        if (0 < avg_elbow < 100 and norm_nose_drop > 0.50):
            status = self.ACTIVE_STATE
        if norm_nose_drop > 0.80:
            status = self.ACTIVE_STATE

        return {
            "view": view,
            "status": status,
            "elbow_angle": round(avg_elbow, 1),
            "nose_drop": round(norm_nose_drop, 3),
            "facing_ratio": round(facing_ratio, 3),
        }


class DeadliftDetector(BaseExerciseDetector):
    """
    Evaluates deadlift form using the hip joint angle (torso-to-leg)
    and vertical displacement of upper-body keypoints.

    Biomechanics:
      Standing (rest):  hips extended, torso upright. Hip angle ~160-175°,
                        shoulders high above ankles.
      Lifting (active): hips flexed, torso bent forward. Hip angle ~80-110°,
                        shoulders drop toward ankle level.

    Primary signal: hip angle (shoulder-hip-knee).
    Secondary signal: shoulder-to-ankle vertical displacement normalized
                      by frame height (captures head/shoulder/elbow drop).

    A rep is: Standing → Lifting → Standing.
    """

    REST_STATE = "Standing"
    ACTIVE_STATE = "Lifting"

    def __init__(self, config_path: str = "config.json"):
        super().__init__(config_path)

    def evaluate_form(self, keypoints: np.ndarray) -> Dict[str, Any]:
        l_sh = keypoints[self.kp_map["left_shoulder"]]
        r_sh = keypoints[self.kp_map["right_shoulder"]]
        l_hip = keypoints[self.kp_map["left_hip"]]
        r_hip = keypoints[self.kp_map["right_hip"]]
        l_knee = keypoints[self.kp_map["left_knee"]]
        r_knee = keypoints[self.kp_map["right_knee"]]
        l_ankle = keypoints[self.kp_map["left_ankle"]]
        r_ankle = keypoints[self.kp_map["right_ankle"]]

        sh_mid = get_midpoint(l_sh, r_sh)
        hip_mid = get_midpoint(l_hip, r_hip)
        ankle_mid = get_midpoint(l_ankle, r_ankle)

        # Hip angle: shoulder-hip-knee (torso vs. upper leg)
        l_hip_angle = calculate_angle(l_sh, l_hip, l_knee)
        r_hip_angle = calculate_angle(r_sh, r_hip, r_knee)
        hip_angles = [a for a in [l_hip_angle, r_hip_angle] if a > 0]
        avg_hip_angle = sum(hip_angles) / len(hip_angles) if hip_angles else 0.0

        # Shoulder-ankle vertical displacement (normalized by frame-height
        # proxy: ankle_y, which is near the bottom of the frame)
        sh_ankle_disp = (ankle_mid[1] - sh_mid[1]) / ankle_mid[1] if ankle_mid[1] > 0 else 0.0

        # View detection
        torso_vert = calculate_vertical_displacement(sh_mid, hip_mid)
        shoulder_width = abs(l_sh[0] - r_sh[0])
        # For deadlifts the facing ratio inflates when bent over,
        # so we only use it at high hip angles for a stable reading.
        facing_ratio = shoulder_width / torso_vert if torso_vert > 0 else 0.0
        if facing_ratio > 0.60:
            view = "Frontal"
        elif facing_ratio < 0.25:
            view = "Profile"
        else:
            view = "Oblique"

        status = self.REST_STATE

        if view == "Profile":
            # Profile: hip angle is the most reliable signal
            if 0 < avg_hip_angle < 130:
                status = self.ACTIVE_STATE
        elif view == "Frontal":
            # Frontal: hip angle foreshortens, lean more on displacement
            if sh_ankle_disp < 0.70 or (0 < avg_hip_angle < 125):
                status = self.ACTIVE_STATE
        else:
            # Oblique / general: blend both signals
            if 0 < avg_hip_angle < 125:
                status = self.ACTIVE_STATE
            elif avg_hip_angle < 140 and sh_ankle_disp < 0.65:
                status = self.ACTIVE_STATE

        # Safety: very acute hip angle is always Lifting
        if 0 < avg_hip_angle < 100:
            status = self.ACTIVE_STATE

        return {
            "view": view,
            "status": status,
            "hip_angle": round(avg_hip_angle, 1),
            "sh_ankle_disp": round(sh_ankle_disp, 3),
            "facing_ratio": round(facing_ratio, 3),
        }