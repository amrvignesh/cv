import os
import cv2
import math
import numpy as np
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename

bp = Blueprint('assignment1', __name__, url_prefix='/api/assignment1')

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

def get_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

@bp.route('/process', methods=['POST'])
def process():
    try:
        # Check if files are present
        if 'calib_image' not in request.files or 'test_image' not in request.files:
            return jsonify({"error": "Missing images"}), 400
        
        calib_file = request.files['calib_image']
        test_file = request.files['test_image']
        
        if calib_file.filename == '' or test_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Save files
        calib_filename = secure_filename(calib_file.filename)
        test_filename = secure_filename(test_file.filename)
        calib_path = os.path.join(UPLOAD_FOLDER, calib_filename)
        test_path = os.path.join(UPLOAD_FOLDER, test_filename)
        calib_file.save(calib_path)
        test_file.save(test_path)

        # Get parameters
        data = request.form
        calib_distance = float(data.get('calib_distance'))
        calib_size = float(data.get('calib_size'))
        test_distance = float(data.get('test_distance'))
        
        # Parse points (expected format: "x1,y1,x2,y2")
        calib_pts_str = data.get('calib_points').split(',')
        test_pts_str = data.get('test_points').split(',')
        
        p1c = (float(calib_pts_str[0]), float(calib_pts_str[1]))
        p2c = (float(calib_pts_str[2]), float(calib_pts_str[3]))
        
        p1t = (float(test_pts_str[0]), float(test_pts_str[1]))
        p2t = (float(test_pts_str[2]), float(test_pts_str[3]))

        # Logic
        L_img_px_calib = get_distance(p1c, p2c)
        f_px = (L_img_px_calib * calib_distance) / calib_size
        
        L_img_px_test = get_distance(p1t, p2t)
        L_pred = (L_img_px_test * test_distance) / f_px

        # Annotate images (optional, but good for display)
        # We can return the result directly
        
        return jsonify({
            "f_px": f_px,
            "L_pred": L_pred,
            "units": data.get('units', 'cm')
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Commit 8 - Development update

# Commit 9 - Development update

# Commit 10 - Development update

# Commit 16 - Development update

# Commit 17 - Development update

# Commit 58 - Development update

# Commit 62 - Development update

# Commit 78 - Development update

# Commit 93 - Development update

# Commit 102 - Development update
