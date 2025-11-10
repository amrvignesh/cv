from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

bp = Blueprint('assignment7', __name__, url_prefix='/assignment7')

# Global storage for calibration data
calibration_storage = {}

def create_object_points(pattern_size, square_size):
    """Create 3D object points for chessboard"""
    objp = np.zeros((pattern_size[0] * pattern_size[1], 3), np.float32)
    objp[:, :2] = np.mgrid[0:pattern_size[0], 0:pattern_size[1]].T.reshape(-1, 2)
    objp *= square_size
    return objp

def decode_image(base64_string):
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    img_data = base64.b64decode(base64_string)
    img = np.array(Image.open(BytesIO(img_data)))
    # Convert RGB to BGR for OpenCV if needed, or keep as RGB if using PIL
    # OpenCV uses BGR, PIL uses RGB.
    # Let's convert to BGR for consistency with OpenCV functions if they expect it, 
    # though findChessboardCorners works on grayscale.
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img

@bp.route('/detect_chessboard', methods=['POST'])
def detect_chessboard():
    try:
        data = request.json
        left_img = decode_image(data['left_image'])
        right_img = decode_image(data['right_image'])
        pattern_size = tuple(data['pattern_size'])
        
        # Resize if too large
        max_dim = 1920
        h, w = left_img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            left_img = cv2.resize(left_img, (0,0), fx=scale, fy=scale)
            right_img = cv2.resize(right_img, (0,0), fx=scale, fy=scale)

        left_gray = cv2.cvtColor(left_img, cv2.COLOR_BGR2GRAY)
        right_gray = cv2.cvtColor(right_img, cv2.COLOR_BGR2GRAY)

        ret_left, corners_left = cv2.findChessboardCorners(left_gray, pattern_size, None)
        ret_right, corners_right = cv2.findChessboardCorners(right_gray, pattern_size, None)

        if not ret_left or not ret_right:
            # Try adaptive threshold
            flags = cv2.CALIB_CB_ADAPTIVE_THRESH + cv2.CALIB_CB_NORMALIZE_IMAGE + cv2.CALIB_CB_FAST_CHECK
            if not ret_left:
                ret_left, corners_left = cv2.findChessboardCorners(left_gray, pattern_size, flags)
            if not ret_right:
                ret_right, corners_right = cv2.findChessboardCorners(right_gray, pattern_size, flags)

        if not ret_left or not ret_right:
            return jsonify({'success': False, 'error': 'Chessboard not found in one or both images'}), 400

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
        corners_left = cv2.cornerSubPix(left_gray, corners_left, (11, 11), (-1, -1), criteria)
        corners_right = cv2.cornerSubPix(right_gray, corners_right, (11, 11), (-1, -1), criteria)

        return jsonify({
            'success': True,
            'left_corners': corners_left.reshape(-1, 2).tolist(),
            'right_corners': corners_right.reshape(-1, 2).tolist()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/calibrate', methods=['POST'])
def calibrate():
    try:
        data = request.json
        calibration_id = data.get('id', 'default')
        pattern_size = tuple(data['pattern_size'])
        square_size = float(data['square_size'])
        image_pairs = data['image_pairs']

        objpoints = []
        imgpoints_left = []
        imgpoints_right = []
        objp = create_object_points(pattern_size, square_size)

        img_shape = None

        for pair in image_pairs:
            left_img = decode_image(pair['left'])
            right_img = decode_image(pair['right'])
            
            if img_shape is None:
                img_shape = left_img.shape[:2][::-1] # (width, height)

            left_gray = cv2.cvtColor(left_img, cv2.COLOR_BGR2GRAY)
            right_gray = cv2.cvtColor(right_img, cv2.COLOR_BGR2GRAY)

            ret_left, corners_left = cv2.findChessboardCorners(left_gray, pattern_size, None)
            ret_right, corners_right = cv2.findChessboardCorners(right_gray, pattern_size, None)

            if ret_left and ret_right:
                criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)
                corners_left = cv2.cornerSubPix(left_gray, corners_left, (11, 11), (-1, -1), criteria)
                corners_right = cv2.cornerSubPix(right_gray, corners_right, (11, 11), (-1, -1), criteria)
                
                objpoints.append(objp)
                imgpoints_left.append(corners_left)
                imgpoints_right.append(corners_right)

        if len(objpoints) < 3:
            return jsonify({'success': False, 'error': f'Need at least 3 valid pairs. Found {len(objpoints)}'}), 400

        ret, mtx1, dist1, mtx2, dist2, R, T, E, F = cv2.stereoCalibrate(
            objpoints, imgpoints_left, imgpoints_right, None, None, None, None, img_shape,
            flags=cv2.CALIB_FIX_ASPECT_RATIO,
            criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1e-6)
        )

        baseline = np.linalg.norm(T)
        calibration_storage[calibration_id] = {
            'cameraMatrix1': mtx1.tolist(), 'distCoeffs1': dist1.tolist(),
            'cameraMatrix2': mtx2.tolist(), 'distCoeffs2': dist2.tolist(),
            'R': R.tolist(), 'T': T.tolist(), 'baseline': float(baseline)
        }

        return jsonify({'success': True, 'baseline': float(baseline), 'reprojection_error': float(ret)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/triangulate', methods=['POST'])
def triangulate():
    try:
        data = request.json
        calibration_id = data.get('id', 'default')
        if calibration_id not in calibration_storage:
            return jsonify({'success': False, 'error': 'Not calibrated'}), 400
        
        calib = calibration_storage[calibration_id]
        left_pts = np.array(data['left_points'], dtype=np.float32).reshape(-1, 1, 2)
        right_pts = np.array(data['right_points'], dtype=np.float32).reshape(-1, 1, 2)

        mtx1 = np.array(calib['cameraMatrix1'])
        dist1 = np.array(calib['distCoeffs1'])
        mtx2 = np.array(calib['cameraMatrix2'])
        dist2 = np.array(calib['distCoeffs2'])
        R = np.array(calib['R'])
        T = np.array(calib['T'])

        left_undist = cv2.undistortPoints(left_pts, mtx1, dist1, P=mtx1)
        right_undist = cv2.undistortPoints(right_pts, mtx2, dist2, P=mtx2)

        P1 = mtx1 @ np.hstack([np.eye(3), np.zeros((3, 1))])
        P2 = mtx2 @ np.hstack([R, T])

        pts4d = cv2.triangulatePoints(P1, P2, left_undist.reshape(-1, 2).T, right_undist.reshape(-1, 2).T)
        pts3d = (pts4d[:3] / pts4d[3]).T

        return jsonify({'success': True, 'points_3d': pts3d.tolist()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/measure', methods=['POST'])
def measure():
    try:
        data = request.json
        points_3d = np.array(data['points_3d'])
        shape = data.get('shape', 'rectangular')
        units = data.get('units', 'mm')
        
        scale = {'mm': 1.0, 'cm': 0.1, 'in': 0.03937}[units]
        result = {}

        if shape == 'rectangular' and len(points_3d) >= 2:
            width = np.linalg.norm(points_3d[1] - points_3d[0]) * scale
            result['width'] = float(width)
            if len(points_3d) >= 3:
                length = np.linalg.norm(points_3d[2] - points_3d[0]) * scale
                result['length'] = float(length)
        elif shape == 'circular' and len(points_3d) >= 2:
            diameter = np.linalg.norm(points_3d[1] - points_3d[0]) * scale
            result['diameter'] = float(diameter)
        
        result['avg_z'] = float(np.mean(points_3d[:, 2]) * scale)
        return jsonify({'success': True, **result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
