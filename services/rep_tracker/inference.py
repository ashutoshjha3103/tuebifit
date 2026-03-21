# inference.py
import cv2
import numpy as np
import onnxruntime as ort
import os
import urllib.request
from typing import Tuple, Dict, Any

class PoseEstimator:
    """
    A generic pose estimation handler using ONNXRuntime for RTMPose models.
    Responsible only for model loading, image preprocessing, and keypoint extraction.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initializes the PoseEstimator with model configuration.

        Args:
            config (Dict[str, Any]): Configuration dictionary containing 'model_filename' 
                                     and 'model_url'.
        """
        self.model_file = config["model_filename"]
        self.model_url = config["model_url"]
        self.ensure_model_exists()
        
        # Initialize ONNX session
        self.session = ort.InferenceSession(self.model_file, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name

    def ensure_model_exists(self) -> None:
        """
        Checks for the existence of the ONNX model file locally. 
        Downloads it from the configured URL if it does not exist.
        """
        if not os.path.exists(self.model_file):
            print(f"Downloading model from {self.model_url}...")
            urllib.request.urlretrieve(self.model_url, self.model_file)
            print("Download complete.")

    def preprocess(self, img: np.ndarray, input_size: Tuple[int, int] = (192, 256)) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Preprocesses an OpenCV image for the RTMPose ONNX model.

        Args:
            img (np.ndarray): The raw BGR image loaded via OpenCV.
            input_size (Tuple[int, int], optional): The target (width, height) for the model. 
                                                    Defaults to (192, 256).

        Returns:
            Tuple[np.ndarray, Tuple[int, int]]: The preprocessed image tensor ready for inference, 
                                                and the input size used.
        """
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, input_size)
        
        # Normalize using ImageNet mean and std
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_normalized = (img_resized / 255.0 - mean) / std
        
        # Convert to Channel-First (CHW) and add Batch dimension
        img_chw = np.transpose(img_normalized, (2, 0, 1))
        img_batch = np.expand_dims(img_chw, axis=0).astype(np.float32)
        
        return img_batch, input_size

    def extract_keypoints(self, image_path: str) -> Tuple[np.ndarray, np.ndarray, float, float]:
        """
        Runs inference on a given image file to extract pose keypoints.

        Args:
            image_path (str): The file path to the target image.

        Raises:
            ValueError: If the image cannot be loaded from the provided path.

        Returns:
            Tuple[np.ndarray, np.ndarray, float, float]: 
                - original_img (np.ndarray): The raw, unscaled image.
                - raw_keypoints (np.ndarray): The [17, 2] array of keypoint coordinates.
                - scale_x (float): The scaling factor for the X-axis to map back to original size.
                - scale_y (float): The scaling factor for the Y-axis to map back to original size.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image at {image_path}")
        
        orig_h, orig_w = img.shape[:2]
        input_tensor, input_size = self.preprocess(img)
        
        outputs = self.session.run(None, {self.input_name: input_tensor})
        raw_keypoints = outputs[0][0] # Assuming shape [1, 17, 2]
        
        # Calculate scale to map the 192x256 model output back to original image dimensions
        scale_x = orig_w / input_size[0]
        scale_y = orig_h / input_size[1]
        
        return img, raw_keypoints, scale_x, scale_y