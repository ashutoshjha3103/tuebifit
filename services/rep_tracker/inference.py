import os
import cv2
import numpy as np
import mediapipe as mp

from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)

from typing import Tuple, Dict, Any

_DEFAULT_MODEL = os.path.join(os.path.dirname(__file__), "pose_landmarker_heavy.task")


class PoseEstimator:
    """
    Pose estimation handler using Google's MediaPipe PoseLandmarker (Tasks API).
    Supports IMAGE mode (single images) and VIDEO mode (sequential frames with
    temporal tracking).
    """

    def __init__(
        self,
        config: Dict[str, Any] = None,
        static_image_mode: bool = True,
        model_path: str = _DEFAULT_MODEL,
        use_gpu: bool = False,
    ):
        mode = RunningMode.IMAGE if static_image_mode else RunningMode.VIDEO
        delegate = self._resolve_delegate(model_path, mode, use_gpu)
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(
                model_asset_path=model_path,
                delegate=delegate,
            ),
            running_mode=mode,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self._landmarker = PoseLandmarker.create_from_options(options)
        self._mode = mode
        self._delegate = delegate
        self._frame_ts_ms = 0

    @staticmethod
    def _resolve_delegate(
        model_path: str, mode: RunningMode, use_gpu: bool
    ) -> BaseOptions.Delegate:
        if not use_gpu:
            return BaseOptions.Delegate.CPU
        try:
            probe = PoseLandmarkerOptions(
                base_options=BaseOptions(
                    model_asset_path=model_path,
                    delegate=BaseOptions.Delegate.GPU,
                ),
                running_mode=mode,
                num_poses=1,
            )
            lm = PoseLandmarker.create_from_options(probe)
            lm.close()
            print("GPU delegate available — using GPU")
            return BaseOptions.Delegate.GPU
        except Exception:
            print("GPU delegate unavailable — falling back to CPU")
            return BaseOptions.Delegate.CPU

    def _landmarks_to_keypoints(self, landmarks, w: int, h: int) -> np.ndarray:
        """Convert normalized PoseLandmarker landmarks to absolute pixel coords."""
        raw_keypoints = np.zeros((33, 2))
        for i, lm in enumerate(landmarks):
            if lm.visibility > 0.4:
                raw_keypoints[i] = [int(lm.x * w), int(lm.y * h)]
        return raw_keypoints

    def extract_keypoints(self, image_path: str) -> Tuple[np.ndarray, np.ndarray, float, float]:
        """Extract 33 BlazePose keypoints from an image file on disk."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image at {image_path}")
        return self.extract_keypoints_from_frame(img)

    def extract_keypoints_from_frame(
        self, frame: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, float, float]:
        """
        Extract 33 BlazePose keypoints from a raw BGR numpy frame.
        Returns (frame, keypoints_33x2, scale_x, scale_y).
        """
        h, w = frame.shape[:2]
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

        if self._mode == RunningMode.IMAGE:
            result = self._landmarker.detect(mp_image)
        else:
            self._frame_ts_ms += 33  # ~30 fps spacing
            result = self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            raise ValueError("No person detected in the frame.")

        raw_keypoints = self._landmarks_to_keypoints(result.pose_landmarks[0], w, h)
        return frame, raw_keypoints, 1.0, 1.0

    def close(self):
        self._landmarker.close()
