import os
import cv2
import numpy as np
import base64
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

bp = Blueprint('assignment3', __name__, url_prefix='/api/assignment3')

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def encode_image(img):
    _, buf = cv2.imencode('.png', img)
    return "data:image/png;base64," + base64.b64encode(buf).decode('utf-8')

@bp.route('/process', methods=['POST'])
def process():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        
        file = request.files['image']
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        img = cv2.imread(filepath)
        if img is None:
            return jsonify({"error": "Could not read image"}), 400
            
        task = request.form.get('task')
        params = request.form
        
        result_img = None
        info = {}
        
        if task == 'gradient':
            # Gradient Magnitude
            ksize = int(params.get('ksize', 3))
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (3,3), 0)
            dx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=ksize)
            dy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=ksize)
            mag = cv2.magnitude(dx, dy)
            mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
            result_img = mag
            
        elif task == 'log':
            # Laplacian of Gaussian
            ksize = int(params.get('ksize', 3))
            sigma = float(params.get('sigma', 1.0))
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (0,0), sigma)
            lap = cv2.Laplacian(blur, cv2.CV_32F, ksize=ksize)
            lap = cv2.convertScaleAbs(lap)
            result_img = lap
            
        elif task == 'edges':
            # Canny Edge Detection
            low = int(params.get('low', 50))
            high = int(params.get('high', 150))
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (3,3), 0)
            edges = cv2.Canny(blur, low, high)
            result_img = edges
            
        elif task == 'corners':
            # Harris Corners
            block = int(params.get('block', 2))
            ksize = int(params.get('ksize', 3))
            k = float(params.get('k', 0.04))
            thresh = int(params.get('thresh', 100))
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = np.float32(gray)
            dst = cv2.cornerHarris(gray, block, ksize, k)
            dst = cv2.dilate(dst, None)
            
            # Threshold for an optimal value, it may vary depending on the image.
            result_img = img.copy()
            result_img[dst > 0.01 * dst.max()] = [0, 0, 255]
            
        elif task == 'boundary':
            # Boundary Detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5,5), 0)
            edges = cv2.Canny(blur, 50, 150) # Auto thresholding could be added
            
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            result_img = img.copy()
            if contours:
                # Filter by area
                contours = sorted(contours, key=cv2.contourArea, reverse=True)
                cnt = contours[0] # Largest
                cv2.drawContours(result_img, [cnt], -1, (0, 255, 0), 2)
                
                # Approx
                epsilon = 0.01 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                cv2.drawContours(result_img, [approx], -1, (255, 0, 0), 2)
                
                info['area'] = cv2.contourArea(cnt)
                info['vertices'] = len(approx)
                
        elif task == 'aruco':
            # ArUco Detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
            parameters = cv2.aruco.DetectorParameters()
            detector = cv2.aruco.ArucoDetector(dictionary, parameters)
            corners, ids, rejected = detector.detectMarkers(gray)
            
            result_img = img.copy()
            if ids is not None:
                cv2.aruco.drawDetectedMarkers(result_img, corners, ids)
                
                # Create mask if requested
                mask = np.zeros_like(gray)
                all_points = []
                for c in corners:
                    all_points.extend(c[0])
                
                if len(all_points) >= 3:
                    all_points = np.array(all_points, dtype=np.int32)
                    hull = cv2.convexHull(all_points)
                    cv2.fillConvexPoly(mask, hull, 255)
                    
                    # Blend mask
                    mask_bgr = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
                    result_img = cv2.addWeighted(result_img, 0.7, mask_bgr, 0.3, 0)

        else:
            return jsonify({"error": "Unknown task"}), 400
            
        return jsonify({
            "image": encode_image(result_img),
            "info": info
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Commit 1 - Development update

# Commit 6 - Development update

# Commit 7 - Development update

# Commit 29 - Development update

# Commit 37 - Development update

# Commit 46 - Development update

# Commit 50 - Development update

# Commit 56 - Development update

# Commit 66 - Development update

# Commit 67 - Development update

# Commit 73 - Development update

# Commit 89 - Development update
