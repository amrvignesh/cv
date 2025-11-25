import os
import cv2
import numpy as np
import glob
from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename
import base64

bp = Blueprint('assignment2', __name__, url_prefix='/api/assignment2')

UPLOAD_FOLDER = 'uploads'
TEMPLATE_FOLDER = os.path.join(os.path.dirname(__file__), 'templates')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMPLATE_FOLDER, exist_ok=True)

# --- Template Matching Logic ---

def rotate_keep_all(tpl, angle):
    rows, cols = tpl.shape[:2]
    M = cv2.getRotationMatrix2D((cols/2, rows/2), angle, 1.0)
    cos, sin = abs(M[0,0]), abs(M[0,1])
    nW = int(rows*sin + cols*cos)
    nH = int(rows*cos + cols*sin)
    M[0,2] += (nW/2) - cols/2
    M[1,2] += (nH/2) - rows/2
    return cv2.warpAffine(tpl, M, (nW, nH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

@bp.route('/match', methods=['POST'])
def match_templates():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        
        file = request.files['image']
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        img_gray = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
        img_bgr = cv2.imread(filepath)
        
        if img_gray is None:
            return jsonify({"error": "Could not read image"}), 400

        # Parameters
        method = cv2.TM_CCOEFF_NORMED
        scales = np.linspace(0.5, 1.4, 19)
        angles = [0, 180]
        score_thresh = float(request.form.get('threshold', 0.60))
        
        template_paths = sorted(glob.glob(os.path.join(TEMPLATE_FOLDER, '*.JPG')))
        results = []
        
        colors = [(0,255,0),(0,180,255),(255,160,0),(255,0,120),(120,255,120),(160,120,255),(200,200,0),(0,220,180)]
        
        for idx, tpath in enumerate(template_paths):
            tpl = cv2.imread(tpath, cv2.IMREAD_GRAYSCALE)
            if tpl is None: continue
            
            best_score, best = -1.0, None
            
            for ang in angles:
                tpl_rot = rotate_keep_all(tpl, ang)
                for s in scales:
                    tw = max(5, int(tpl_rot.shape[1]*s))
                    th = max(5, int(tpl_rot.shape[0]*s))
                    
                    if tw >= img_gray.shape[1] or th >= img_gray.shape[0]:
                        continue
                        
                    tpl_scaled = cv2.resize(tpl_rot, (tw, th), interpolation=cv2.INTER_AREA)
                    res = cv2.matchTemplate(img_gray, tpl_scaled, method)
                    _, max_val, _, max_loc = cv2.minMaxLoc(res)
                    
                    if max_val > best_score:
                        best_score = max_val
                        best = (max_loc, (tw, th), s, ang)
            
            if best and best_score >= score_thresh:
                (x,y), (w,h), s, ang = best
                name = os.path.splitext(os.path.basename(tpath))[0]
                results.append({
                    "name": name,
                    "score": float(best_score),
                    "box": [int(x), int(y), int(w), int(h)],
                    "scale": float(s),
                    "angle": int(ang)
                })
                
                color = colors[idx % len(colors)]
                cv2.rectangle(img_bgr, (x,y), (x+w, y+h), color, 2)
                cv2.putText(img_bgr, f"{name} {best_score:.2f}", (x, max(15, y-6)), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 1, cv2.LINE_AA)

        # Encode result image
        _, buffer = cv2.imencode('.jpg', img_bgr)
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            "detections": results,
            "image": f"data:image/jpeg;base64,{img_str}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Deblurring Logic ---

def gaussian_psf(ksize, sigma):
    ax = np.arange(ksize) - (ksize - 1)/2.0
    xx, yy = np.meshgrid(ax, ax)
    psf = np.exp(-(xx**2 + yy**2)/(2.0*sigma**2)).astype(np.float32)
    psf /= psf.sum()
    return psf

def psf_to_otf(psf, shapeHW):
    H, W = shapeHW
    pad = np.zeros((H, W), np.float32)
    pad[:psf.shape[0], :psf.shape[1]] = np.fft.ifftshift(psf)
    return np.fft.fft2(pad)

def wiener_deconv(G, H, K): return (np.conj(H)/(np.abs(H)**2 + K)) * G
def inverse_deconv(G, H, eps=1e-6): return G / (H + eps)

@bp.route('/deblur', methods=['POST'])
def deblur_image():
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
            
        # Parameters
        sigma = float(request.form.get('sigma', 3.0))
        ksize = int(request.form.get('ksize', 19))
        mode = request.form.get('mode', 'wiener')
        k_wiener = float(request.form.get('k_wiener', 0.01))
        region_blur = request.form.get('region_blur') == 'true'
        
        if ksize % 2 == 0: ksize += 1
        
        L = img.astype(np.float32) / 255.0
        
        # Create PSF/OTF
        psf = gaussian_psf(ksize, sigma)
        Hh, Ww = L.shape[:2]
        OTF = psf_to_otf(psf, (Hh, Ww))
        
        # 1. Blur
        if region_blur:
            # Blur only a central region
            L_b = L.copy()
            cy, cx = Hh // 2, Ww // 2
            rh, rw = Hh // 3, Ww // 3
            roi = L[cy-rh:cy+rh, cx-rw:cx+rw]
            roi_b = np.stack([cv2.filter2D(roi[:,:,c], -1, psf, borderType=cv2.BORDER_REFLECT) for c in range(3)], axis=2)
            L_b[cy-rh:cy+rh, cx-rw:cx+rw] = roi_b
        else:
            L_b = np.stack([cv2.filter2D(L[:,:,c], -1, psf, borderType=cv2.BORDER_REFLECT) for c in range(3)], axis=2)
        
        # 2. Recover
        L_rec = np.zeros_like(L)
        for c in range(3):
            G = np.fft.fft2(L_b[:,:,c])
            Fhat = wiener_deconv(G, OTF, k_wiener) if mode=="wiener" else inverse_deconv(G, OTF, 1e-6)
            L_rec[:,:,c] = np.clip(np.fft.ifft2(Fhat).real, 0.0, 1.0)
            
        # Encode images
        def encode(img_arr):
            _, buf = cv2.imencode('.jpg', np.clip(img_arr*255, 0, 255).astype(np.uint8))
            return "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')
            
        return jsonify({
            "original": encode(L),
            "blurred": encode(L_b),
            "recovered": encode(L_rec)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Commit 63 - Development update

# Commit 87 - Development update

# Commit 111 - Development update

# Commit 119 - Development update

# Development update 147 - 2025-12-03

# Development update 149 - 2025-12-03
