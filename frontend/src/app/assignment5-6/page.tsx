'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ObjectTracker } from './tracker';

// Helper to get cv from window
function getCv() {
    return (window as any).cv;
}

export default function Assignment56() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tracker, setTracker] = useState<ObjectTracker | null>(null);
    const [cvReady, setCvReady] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [mode, setMode] = useState<'marker' | 'markerless' | 'sam2' | 'qr'>('marker');
    const [selectionMode, setSelectionMode] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);

    // Stats
    const [fps, setFps] = useState(0);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        if (cvReady && !tracker) {
            setTracker(new ObjectTracker());
            setStatus('Ready to start');
        }
    }, [cvReady]);

    useEffect(() => {
        if (tracker) {
            tracker.setMode(mode);
            setStatus(`Mode switched to: ${mode}`);
        }
    }, [mode, tracker]);

    const isStreamingRef = useRef(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsStreaming(true);
                isStreamingRef.current = true;
                setStatus('Camera active');
                requestAnimationFrame(processFrame);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera");
            setStatus('Camera error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
            isStreamingRef.current = false;
            setStatus('Camera stopped');
        }
    };

    let lastTime = Date.now();
    let frameCount = 0;

    const processFrame = () => {
        if (!isStreamingRef.current) return;

        const cv = getCv();
        if (!videoRef.current || !canvasRef.current || !tracker || !cvReady || !cv) {
            requestAnimationFrame(processFrame);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video to canvas
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                // Use matFromImageData like v1 for reliability
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                if (imageData) {
                    const src = cv.matFromImageData(imageData);
                    const dst = src.clone();

                    tracker.processFrame(src, dst);

                    cv.imshow(canvas, dst);
                    src.delete();
                    dst.delete();
                }

                // FPS Calc
                frameCount++;
                const now = Date.now();
                if (now - lastTime >= 1000) {
                    setFps(frameCount);
                    frameCount = 0;
                    lastTime = now;
                }

            } catch (e) {
                console.error("OpenCV processing error:", e);
            }
        }

        requestAnimationFrame(processFrame);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode === 'markerless' && selectionMode && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            // Scale coords
            const scaleX = canvasRef.current.width / rect.width;
            const scaleY = canvasRef.current.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            setStartPoint({ x, y });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (mode === 'markerless' && selectionMode && startPoint && canvasRef.current && tracker) {
            const rect = canvasRef.current.getBoundingClientRect();
            const scaleX = canvasRef.current.width / rect.width;
            const scaleY = canvasRef.current.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const width = Math.abs(x - startPoint.x);
            const height = Math.abs(y - startPoint.y);
            const rx = Math.min(x, startPoint.x);
            const ry = Math.min(y, startPoint.y);

            if (width > 10 && height > 10) {
                const cv = getCv();
                if (!cv) return;
                const cvRect = new cv.Rect(rx, ry, width, height);
                const src = cv.imread(canvasRef.current);
                tracker.setTemplate(cvRect, src);
                src.delete();
                setSelectionMode(false);
                setStatus('Object selected - Tracking...');
            }
            setStartPoint(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && tracker) {
            const file = e.target.files[0];
            const buffer = await file.arrayBuffer();
            await tracker.loadSAM2Data(buffer);
            setStatus('SAM2 Data Loaded');
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <Script
                src="https://docs.opencv.org/4.8.0/opencv.js"
                onLoad={() => {
                    if ((window as any).cv.getBuildInformation) {
                        setCvReady(true);
                    } else {
                        (window as any).cv.onRuntimeInitialized = () => setCvReady(true);
                    }
                }}
            />

            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Real-Time Tracking</h1>
                        <p className="text-gray-500">Assignment 5-6 • Robust Implementation</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`badge ${cvReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {cvReady ? 'OpenCV Ready' : 'Loading OpenCV...'}
                        </span>
                        <span className={`badge ${isStreaming ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {isStreaming ? `Live (${fps} FPS)` : 'Offline'}
                        </span>
                    </div>
                </header>

                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as any)}
                                className="input-field w-48"
                            >
                                <option value="marker">Marker (ArUco)</option>
                                <option value="qr">QR Code</option>
                                <option value="markerless">Marker-Less</option>
                                <option value="sam2">SAM2 Segmentation</option>
                            </select>

                            {!isStreaming ? (
                                <button
                                    onClick={startCamera}
                                    disabled={!cvReady}
                                    className="btn btn-primary"
                                >
                                    Start Camera
                                </button>
                            ) : (
                                <button
                                    onClick={stopCamera}
                                    className="btn btn-danger"
                                >
                                    Stop Camera
                                </button>
                            )}

                            {mode === 'markerless' && isStreaming && (
                                <button
                                    onClick={() => setSelectionMode(!selectionMode)}
                                    className={`btn ${selectionMode ? 'btn-danger' : 'btn-secondary'}`}
                                >
                                    {selectionMode ? 'Cancel Selection' : 'Select Object'}
                                </button>
                            )}

                            {mode === 'sam2' && (
                                <input
                                    type="file"
                                    accept=".npz"
                                    onChange={handleFileUpload}
                                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            )}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                            Status: {status}
                        </div>
                    </div>

                    <div className="relative aspect-video bg-black">
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-contain opacity-0"
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                        />
                        {!isStreaming && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-2">
                                <div className="text-4xl text-gray-700">📷</div>
                                <div>Camera Stopped</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card bg-blue-50 border-blue-100">
                        <h3 className="label text-blue-800">Instructions</h3>
                        <p className="text-sm text-blue-900">
                            {mode === 'marker' && "Show an ArUco marker (DICT_6X6_250) to the camera."}
                            {mode === 'qr' && "Show a QR code to the camera."}
                            {mode === 'markerless' && "Click 'Select Object', then drag a box around the target."}
                            {mode === 'sam2' && "Upload a .npz file with SAM2 masks."}
                        </p>
                    </div>
                    <div className="card">
                        <h3 className="label">Debug Info</h3>
                        <div className="text-xs font-mono text-gray-600">
                            <div>Mode: {mode}</div>
                            <div>FPS: {fps}</div>
                            <div>Tracker: {tracker ? 'Active' : 'Inactive'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

# Commit 11 - Development update

# Commit 14 - Development update

# Commit 20 - Development update

# Commit 26 - Development update

# Commit 27 - Development update

# Commit 28 - Development update

# Commit 39 - Development update

# Commit 51 - Development update

# Commit 83 - Development update

# Commit 85 - Development update

# Commit 105 - Development update

# Commit 109 - Development update

# Development update 177 - 2025-12-03
