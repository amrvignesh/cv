import { NPZParser } from './npz_parser';

// Helper to get cv from window
function getCv() {
    return (window as any).cv;
}

export class ObjectTracker {
    trackingMode: 'marker' | 'markerless' | 'sam2' | 'qr' = 'marker';
    isTracking = false;
    template: any = null;
    templateRect: any = null;
    sam2Data: any = null;
    sam2Masks: any[] = [];
    sam2Centroids: any[] = [];
    arucoDetector: any = null;
    qrDetector: any = null;

    constructor() {
        this.initDetectors();
    }

    initDetectors() {
        const cv = getCv();
        try {
            if (cv && cv.aruco && cv.aruco.getPredefinedDictionary) {
                const dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_6X6_250);
                const parameters = new cv.aruco.DetectorParameters();
                this.arucoDetector = new cv.aruco.ArucoDetector(dictionary, parameters);
            }
        } catch (e) {
            console.warn('ArUco init failed', e);
        }

        try {
            if (cv && cv.QRCodeDetector) {
                this.qrDetector = new cv.QRCodeDetector();
            }
        } catch (e) {
            console.warn('QR init failed', e);
        }
    }

    setMode(mode: 'marker' | 'markerless' | 'sam2' | 'qr') {
        this.trackingMode = mode;
        this.reset();
    }

    reset() {
        this.template = null;
        this.templateRect = null;
        // Keep SAM2 data loaded
    }

    processFrame(src: any, dst: any) {
        const cv = getCv();
        if (!cv) return;

        switch (this.trackingMode) {
            case 'marker':
                this.trackMarker(src, dst);
                break;
            case 'qr':
                this.trackQR(src, dst);
                break;
            case 'markerless':
                this.trackMarkerless(src, dst);
                break;
            case 'sam2':
                this.trackSAM2(src, dst);
                break;
        }
    }

    trackQR(src: any, dst: any) {
        const cv = getCv();
        if (this.qrDetector && cv) {
            try {
                const points = new cv.Mat();
                const res = this.qrDetector.detectAndDecode(src, points);
                if (points.rows > 0) {
                    const pt1 = new cv.Point(points.data32F[0], points.data32F[1]);
                    const pt2 = new cv.Point(points.data32F[2], points.data32F[3]);
                    const pt3 = new cv.Point(points.data32F[4], points.data32F[5]);
                    const pt4 = new cv.Point(points.data32F[6], points.data32F[7]);

                    cv.line(dst, pt1, pt2, new cv.Scalar(255, 0, 0, 255), 3);
                    cv.line(dst, pt2, pt3, new cv.Scalar(255, 0, 0, 255), 3);
                    cv.line(dst, pt3, pt4, new cv.Scalar(255, 0, 0, 255), 3);
                    cv.line(dst, pt4, pt1, new cv.Scalar(255, 0, 0, 255), 3);

                    if (res) {
                        cv.putText(dst, res, pt1, cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 0, 0, 255), 2);
                    }
                }
                points.delete();
            } catch (e) { console.warn(e); }
        }
    }

    trackMarker(src: any, dst: any) {
        const cv = getCv();
        if (!cv) return;
        let found = false;

        // ArUco
        if (this.arucoDetector) {
            try {
                const corners = new cv.MatVector();
                const ids = new cv.MatVector();
                const rejected = new cv.MatVector();
                this.arucoDetector.detectMarkers(src, corners, ids, rejected);
                if (ids.size() > 0) {
                    found = true;
                    cv.aruco.drawDetectedMarkers(dst, corners, ids);
                }
                corners.delete(); ids.delete(); rejected.delete();
            } catch (e) { console.warn(e); }
        }

        // Fallback: Contours
        if (!found) {
            this.trackMarkerContours(src, dst);
        }
    }

    trackMarkerContours(src: any, dst: any) {
        const cv = getCv();
        if (!cv) return;
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        const thresh = new cv.Mat();
        cv.threshold(gray, thresh, 127, 255, cv.THRESH_BINARY_INV);
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const area = cv.contourArea(cnt);
            if (area > 500 && area < 50000) {
                const approx = new cv.Mat();
                cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
                if (approx.rows === 4) {
                    const rect = cv.boundingRect(approx);
                    const ar = rect.width / rect.height;
                    if (ar > 0.7 && ar < 1.3) {
                        cv.rectangle(dst, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), new cv.Scalar(0, 255, 0, 255), 2);
                    }
                }
                approx.delete();
            }
            cnt.delete();
        }
        gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
    }

    setTemplate(rect: any, frame: any) {
        this.templateRect = rect;
        const roi = frame.roi(rect);
        this.template = roi.clone();
        roi.delete();
    }

    trackMarkerless(src: any, dst: any) {
        const cv = getCv();
        if (!this.template || !cv) return;

        const srcGray = new cv.Mat();
        cv.cvtColor(src, srcGray, cv.COLOR_RGBA2GRAY);
        const templGray = new cv.Mat();
        cv.cvtColor(this.template, templGray, cv.COLOR_RGBA2GRAY);

        const result = new cv.Mat();
        cv.matchTemplate(srcGray, templGray, result, cv.TM_CCOEFF_NORMED);
        const minMax = cv.minMaxLoc(result);
        const maxLoc = minMax.maxLoc;
        const maxVal = minMax.maxVal;

        if (maxVal > 0.6) {
            const pt1 = new cv.Point(maxLoc.x, maxLoc.y);
            const pt2 = new cv.Point(maxLoc.x + this.template.cols, maxLoc.y + this.template.rows);
            cv.rectangle(dst, pt1, pt2, new cv.Scalar(0, 255, 0, 255), 2);
        }

        srcGray.delete(); templGray.delete(); result.delete();
    }

    async loadSAM2Data(buffer: ArrayBuffer) {
        const parser = new NPZParser();
        const npz = await parser.parseNPZ(buffer);
        if (npz.masks) {
            this.sam2Masks = parser.numpyToMat(npz.masks);
            if (!Array.isArray(this.sam2Masks)) this.sam2Masks = [this.sam2Masks];
        }
    }

    trackSAM2(src: any, dst: any) {
        const cv = getCv();
        if (!this.sam2Masks || this.sam2Masks.length === 0 || !cv) return;

        const combinedMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC4);
        const color = new cv.Scalar(255, 0, 255, 100);

        for (const mask of this.sam2Masks) {
            let scaledMask = mask;
            if (mask.rows !== src.rows || mask.cols !== src.cols) {
                scaledMask = new cv.Mat();
                cv.resize(mask, scaledMask, new cv.Size(src.cols, src.rows));
            }

            const maskRGBA = new cv.Mat();
            cv.cvtColor(scaledMask, maskRGBA, cv.COLOR_GRAY2RGBA);
            const colorMat = new cv.Mat(maskRGBA.rows, maskRGBA.cols, cv.CV_8UC4, color);
            cv.bitwise_and(maskRGBA, colorMat, maskRGBA);
            cv.add(combinedMask, maskRGBA, combinedMask);

            // Draw Box
            const rect = cv.boundingRect(scaledMask);
            cv.rectangle(dst, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), new cv.Scalar(255, 0, 255, 255), 2);

            if (scaledMask !== mask) scaledMask.delete();
            maskRGBA.delete(); colorMat.delete();
        }

        cv.addWeighted(dst, 1.0, combinedMask, 0.3, 0, dst);
        combinedMask.delete();
    }
}
