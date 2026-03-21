# utils.py
import math
from typing import Tuple, List

def calculate_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """
    Calculates the angle between three points with the second point as the vertex.

    Args:
        a (Tuple[float, float]): The (x, y) coordinates of the first point.
        b (Tuple[float, float]): The (x, y) coordinates of the vertex point.
        c (Tuple[float, float]): The (x, y) coordinates of the third point.

    Returns:
        float: The angle in degrees between the two vectors (ba and bc). 
               Returns 0.0 if either vector has a magnitude of 0.
    """
    ba = [a[0] - b[0], a[1] - b[1]]
    bc = [c[0] - b[0], c[1] - b[1]]
    
    dot_product = (ba[0] * bc[0]) + (ba[1] * bc[1])
    mag_ba = math.sqrt(ba[0]**2 + ba[1]**2)
    mag_bc = math.sqrt(bc[0]**2 + bc[1]**2)
    
    if mag_ba == 0 or mag_bc == 0:
        return 0.0
        
    cos_angle = max(-1.0, min(1.0, dot_product / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))

def get_midpoint(p1: Tuple[float, float], p2: Tuple[float, float]) -> Tuple[float, float]:
    """
    Calculates the geometric midpoint between two 2D coordinates.

    Args:
        p1 (Tuple[float, float]): The (x, y) coordinates of the first point.
        p2 (Tuple[float, float]): The (x, y) coordinates of the second point.

    Returns:
        Tuple[float, float]: The (x, y) coordinates of the midpoint.
    """
    return ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)

def calculate_vertical_displacement(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Calculates the absolute vertical (Y-axis) distance between two points.

    Args:
        p1 (Tuple[float, float]): The (x, y) coordinates of the first point.
        p2 (Tuple[float, float]): The (x, y) coordinates of the second point.

    Returns:
        float: The absolute difference between the Y-coordinates.
    """
    return abs(p1[1] - p2[1])

def calculate_horizontal_displacement(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Calculates the absolute horizontal (X-axis) distance between two points.

    Args:
        p1 (Tuple[float, float]): The (x, y) coordinates of the first point.
        p2 (Tuple[float, float]): The (x, y) coordinates of the second point.

    Returns:
        float: The absolute difference between the X-coordinates.
    """
    return abs(p1[0] - p2[0])