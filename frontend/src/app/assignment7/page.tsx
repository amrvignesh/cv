'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

export default function Assignment7() {
    const [activeTab, setActiveTab] = useState<'stereo' | 'pose'>('stereo');

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Stereo & Pose</h1>
                        <p className="text-gray-500">Assignment 7 • Robust Implementation</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('stereo')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stereo' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Stereo Measurement
                        </button>
                        <button
                            onClick={() => setActiveTab('pose')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pose' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pose & Hand Tracking
                        </button>
                    </div>
                </header>

                {activeTab === 'stereo' ? <StereoMeasurement /> : <PoseTracking />}
            </div>
        </div>
    );
}

function StereoMeasurement() {
    const [mode, setMode] = useState<'calibration' | 'measurement'>('calibration');
    const [calibPairs, setCalibPairs] = useState<any[]>([]);
    const [calibResult, setCalibResult] = useState<any>(null);
    const [leftImg, setLeftImg] = useState<string | null>(null);
    const [rightImg, setRightImg] = useState<string | null>(null);
    const [leftPoints, setLeftPoints] = useState<{ x: number, y: number }[]>([]);
    const [rightPoints, setRightPoints] = useState<{ x: number, y: number }[]>([]);
    const [measureResult, setMeasureResult] = useState<any>(null);
    const [objectShape, setObjectShape] = useState('rectangular');
    const [units, setUnits] = useState('mm');

    const handleFile = (e: any, setImg: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImg(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const addCalibrationPair = async () => {
        if (!leftImg || !rightImg) return alert("Upload both images");
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment7/detect_chessboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    left_image: leftImg,
                    right_image: rightImg,
                    pattern_size: [9, 6]
                })
            });
            const data = await res.json();
            if (data.success) {
                setCalibPairs([...calibPairs, { left: leftImg, right: rightImg }]);
                setLeftImg(null); setRightImg(null);
                alert("Pair added!");
            } else {
                alert("Chessboard not found: " + data.error);
            }
        } catch (e) { alert("Error: " + e); }
    };

    const calibrate = async () => {
        if (calibPairs.length < 3) return alert("Need at least 3 pairs");
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment7/calibrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_pairs: calibPairs,
                    pattern_size: [9, 6],
                    square_size: 20
                })
            });
            const data = await res.json();
            if (data.success) setCalibResult(data);
            else alert("Calibration failed: " + data.error);
        } catch (e) { alert("Error: " + e); }
    };

    const measure = async () => {
        if (leftPoints.length !== rightPoints.length) return alert("Point counts mismatch");
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            // 1. Triangulate
            const resTri = await fetch(`${API_URL}/assignment7/triangulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    left_points: leftPoints.map(p => [p.x, p.y]),
                    right_points: rightPoints.map(p => [p.x, p.y])
                })
            });
            const dataTri = await resTri.json();
            if (!dataTri.success) return alert(dataTri.error);

            // 2. Measure
            const resMeas = await fetch(`${API_URL}/assignment7/measure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points_3d: dataTri.points_3d,
                    shape: objectShape,
                    units: units
                })
            });
            const dataMeas = await resMeas.json();
            if (dataMeas.success) setMeasureResult(dataMeas);
            else alert(dataMeas.error);
        } catch (e) { alert("Error: " + e); }
    };

    const ImageCanvas = ({ src, points, setPoints }: any) => {
        const imgRef = useRef<HTMLImageElement>(null);
        const handleClick = (e: any) => {
            if (!imgRef.current) return;
            const rect = e.target.getBoundingClientRect();
            const scaleX = imgRef.current.naturalWidth / rect.width;
            const scaleY = imgRef.current.naturalHeight / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            setPoints([...points, { x, y }]);
        };

        return (
            <div className="relative inline-block w-full" onClick={handleClick}>
                {src ? (
                    <img ref={imgRef} src={src} className="w-full h-auto rounded-lg border border-gray-200" />
                ) : (
                    <div className="w-full aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        Upload Image
                    </div>
                )}
                {points.map((p: any, i: number) => (
                    <div key={i} className="absolute w-3 h-3 bg-green-500 rounded-full -ml-1.5 -mt-1.5 pointer-events-none border border-white shadow-sm"
                        style={{
                            left: (p.x / (imgRef.current?.naturalWidth || 1)) * 100 + '%',
                            top: (p.y / (imgRef.current?.naturalHeight || 1)) * 100 + '%'
                        }}
                    >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-white text-gray-800 px-1.5 py-0.5 rounded shadow-sm font-bold">{i + 1}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-center gap-4 bg-gray-50 p-2 rounded-xl w-fit mx-auto">
                <button
                    onClick={() => setMode('calibration')}
                    className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${mode === 'calibration' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Calibration
                </button>
                <button
                    onClick={() => setMode('measurement')}
                    className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${mode === 'measurement' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Measurement
                </button>
            </div>

            {mode === 'calibration' && (
                <div className="card space-y-8">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Calibration Pairs ({calibPairs.length})</h2>
                        <div className="text-sm text-gray-500">Need min 3 pairs</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="label">Left Image</label>
                            <input type="file" onChange={(e) => handleFile(e, setLeftImg)} className="input-field mb-4" />
                            {leftImg && <img src={leftImg} className="w-full rounded-lg border border-gray-200" />}
                        </div>
                        <div>
                            <label className="label">Right Image</label>
                            <input type="file" onChange={(e) => handleFile(e, setRightImg)} className="input-field mb-4" />
                            {rightImg && <img src={rightImg} className="w-full rounded-lg border border-gray-200" />}
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-gray-100 pt-6">
                        <button onClick={addCalibrationPair} className="btn btn-secondary">Add Pair</button>
                        <button onClick={calibrate} className="btn btn-primary">Run Calibration</button>
                    </div>

                    {calibResult && calibResult.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">Error: {calibResult.error}</div>
                    ) : calibResult && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Calibration Successful! Baseline: <span className="font-bold">{calibResult.baseline.toFixed(2)} mm</span>
                        </div>
                    )}
                </div>
            )}

            {mode === 'measurement' && (
                <div className="card space-y-8">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900">3D Measurement</h2>
                        <div className="flex gap-4">
                            <select value={objectShape} onChange={e => setObjectShape(e.target.value)} className="input-field w-40">
                                <option value="rectangular">Rectangular</option>
                                <option value="circular">Circular</option>
                                <option value="polygon">Polygon</option>
                            </select>
                            <select value={units} onChange={e => setUnits(e.target.value)} className="input-field w-24">
                                <option value="mm">mm</option>
                                <option value="cm">cm</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="label">Left View</label>
                            <input type="file" onChange={(e) => handleFile(e, setLeftImg)} className="input-field mb-4" />
                            <ImageCanvas src={leftImg} points={leftPoints} setPoints={setLeftPoints} />
                        </div>
                        <div>
                            <label className="label">Right View</label>
                            <input type="file" onChange={(e) => handleFile(e, setRightImg)} className="input-field mb-4" />
                            <ImageCanvas src={rightImg} points={rightPoints} setPoints={setRightPoints} />
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-gray-100 pt-6">
                        <button onClick={() => { setLeftPoints([]); setRightPoints([]); }} className="btn btn-secondary">Clear Points</button>
                        <button onClick={measure} className="btn btn-primary">Calculate Size</button>
                    </div>

                    {measureResult && measureResult.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">Error: {measureResult.error}</div>
                    ) : measureResult && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div className="text-xs text-indigo-600 uppercase font-bold mb-1">Width</div>
                                <div className="text-2xl font-bold text-indigo-900">{measureResult.width?.toFixed(2)} {units}</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div className="text-xs text-indigo-600 uppercase font-bold mb-1">Length</div>
                                <div className="text-2xl font-bold text-indigo-900">{measureResult.length?.toFixed(2)} {units}</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div className="text-xs text-indigo-600 uppercase font-bold mb-1">Avg Depth (Z)</div>
                                <div className="text-2xl font-bold text-indigo-900">{measureResult.avg_z?.toFixed(2)} {units}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PoseTracking() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [active, setActive] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordedData, setRecordedData] = useState<any[]>([]);

    // Stats
    const [frameCount, setFrameCount] = useState(0);
    const startTimeRef = useRef<number>(0);

    const onResults = (results: any, type: 'pose' | 'hands') => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        if (type === 'pose') {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            if (results.poseLandmarks) {
                (window as any).drawConnectors(ctx, results.poseLandmarks, (window as any).POSE_CONNECTIONS, { color: '#00d4ff', lineWidth: 4 });
                (window as any).drawLandmarks(ctx, results.poseLandmarks, { color: '#ffffff', lineWidth: 2, radius: 4 });

                // Record
                if (recording) {
                    setRecordedData(prev => [...prev, {
                        timestamp: Date.now() - startTimeRef.current,
                        landmarks: results.poseLandmarks
                    }]);
                    setFrameCount(c => c + 1);
                }
            }
            ctx.restore();
        }
    };

    const startCamera = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const Pose = (window as any).Pose;
        const Hands = (window as any).Hands;
        const Camera = (window as any).Camera;

        if (!Pose || !Hands || !Camera) return alert("MediaPipe not loaded yet");

        const pose = new Pose({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        pose.onResults((res: any) => onResults(res, 'pose'));

        const cam = new Camera(videoRef.current, {
            onFrame: async () => {
                await pose.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480
        });
        cam.start();
        setActive(true);
    };

    const toggleRecording = () => {
        if (!recording) {
            setRecordedData([]);
            setFrameCount(0);
            startTimeRef.current = Date.now();
            setRecording(true);
        } else {
            setRecording(false);
        }
    };

    const exportCSV = () => {
        if (recordedData.length === 0) return alert("No data recorded");

        let csv = "Timestamp,LandmarkIndex,X,Y,Z,Visibility\n";
        recordedData.forEach(frame => {
            frame.landmarks.forEach((lm: any, idx: number) => {
                csv += `${frame.timestamp},${idx},${lm.x},${lm.y},${lm.z},${lm.visibility}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pose_data.csv';
        a.click();
    };

    return (
        <div className="card p-0 overflow-hidden">
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" />

            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Real-time Pose Tracking</h2>
                <div className="flex gap-2">
                    <button onClick={startCamera} disabled={active} className="btn btn-primary">
                        Start Camera
                    </button>
                    {active && (
                        <>
                            <button
                                onClick={toggleRecording}
                                className={`btn ${recording ? 'btn-danger' : 'btn-secondary'}`}
                            >
                                {recording ? `Stop Recording (${frameCount})` : 'Start Recording'}
                            </button>
                            <button
                                onClick={exportCSV}
                                disabled={recording || recordedData.length === 0}
                                className="btn btn-secondary"
                            >
                                Export CSV
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="relative aspect-video bg-black">
                <video ref={videoRef} className="hidden" />
                <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-contain" />
                {!active && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-2">
                        <div className="text-4xl">📷</div>
                        <div>Camera Inactive</div>
                    </div>
                )}
                {recording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        REC
                    </div>
                )}
            </div>
        </div>
    );
}

# Commit 32 - Development update

# Commit 45 - Development update

# Commit 59 - Development update

# Commit 65 - Development update

# Commit 70 - Development update

# Commit 95 - Development update

# Commit 104 - Development update

# Commit 129 - Development update

# Commit 142 - Development update

# Commit 148 - Development update

# Development update 152 - 2025-12-03

# Development update 154 - 2025-12-03

# Development update 165 - 2025-12-03

# Development update 170 - 2025-12-03

# Development update 195 - 2025-12-03
