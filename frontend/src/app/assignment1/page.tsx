'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';

export default function Assignment1() {
    const [mode, setMode] = useState<'calib' | 'measure'>('calib');

    // Image State
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imgDims, setImgDims] = useState<{ w: number, h: number } | null>(null);

    // Points
    const [calibPoints, setCalibPoints] = useState<{ x: number, y: number }[]>([]);
    const [measurePoints, setMeasurePoints] = useState<{ x: number, y: number }[]>([]);

    // Params
    const [calibDist, setCalibDist] = useState<string>('20');
    const [calibSize, setCalibSize] = useState<string>('4');
    const [testDist, setTestDist] = useState<string>('32');
    const [truthSize, setTruthSize] = useState<string>('');
    const [units, setUnits] = useState<string>('cm');

    // Results
    const [fpx, setFpx] = useState<number | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load persisted fpx
    useEffect(() => {
        const stored = localStorage.getItem('fpx');
        if (stored) setFpx(parseFloat(stored));
    }, []);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Image
        if (image) {
            // Fit image to canvas
            const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
            const w = image.width * scale;
            const h = image.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;

            ctx.drawImage(image, x, y, w, h);

            // Draw Points
            const points = mode === 'calib' ? calibPoints : measurePoints;

            // Helper to map normalized coords back to canvas
            const toCanvas = (p: { x: number, y: number }) => ({
                x: x + p.x * w,
                y: y + p.y * h
            });

            points.forEach((p, i) => {
                const cp = toCanvas(p);
                ctx.beginPath();
                ctx.arc(cp.x, cp.y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#22c55e'; // green-500
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.fillStyle = 'white';
                ctx.font = '12px Inter';
                ctx.fillText((i + 1).toString(), cp.x + 8, cp.y - 8);
            });

            // Draw Line
            if (points.length === 2) {
                const p1 = toCanvas(points[0]);
                const p2 = toCanvas(points[1]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Draw Distance Label
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const pxDist = Math.hypot(p1.x - p2.x, p1.y - p2.y); // Canvas pixels

                // Real pixels (on original image)
                const realPx = Math.hypot(
                    (points[0].x - points[1].x) * image.width,
                    (points[0].y - points[1].y) * image.height
                );

                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(midX - 40, midY - 25, 80, 20);
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(`${realPx.toFixed(1)} px`, midX, midY - 10);
            }
        } else {
            // Placeholder
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#9ca3af';
            ctx.textAlign = 'center';
            ctx.font = '16px Inter';
            ctx.fillText('No Image Loaded', canvas.width / 2, canvas.height / 2);
        }
    }, [image, calibPoints, measurePoints, mode]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setPreview(url);
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setImgDims({ w: img.width, h: img.height });
                setCalibPoints([]);
                setMeasurePoints([]);
            };
            img.src = url;
        }
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (e) {
            alert("Could not access webcam");
        }
    };

    const captureWebcam = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const url = canvas.toDataURL();
            setPreview(url);
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setImgDims({ w: img.width, h: img.height });
                setCalibPoints([]);
                setMeasurePoints([]);
            };
            img.src = url;

            // Stop stream
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate image bounds on canvas
        const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        // Click pos relative to image
        const clickX = e.clientX - rect.left - x;
        const clickY = e.clientY - rect.top - y;

        // Normalize (0-1)
        const normX = clickX / w;
        const normY = clickY / h;

        if (normX < 0 || normX > 1 || normY < 0 || normY > 1) return;

        const pts = mode === 'calib' ? calibPoints : measurePoints;
        const setPts = mode === 'calib' ? setCalibPoints : setMeasurePoints;

        if (pts.length >= 2) {
            setPts([{ x: normX, y: normY }]);
        } else {
            setPts([...pts, { x: normX, y: normY }]);
        }
    };

    const calibrate = () => {
        if (calibPoints.length !== 2 || !image) return alert("Select 2 points");

        const dx = (calibPoints[0].x - calibPoints[1].x) * image.width;
        const dy = (calibPoints[0].y - calibPoints[1].y) * image.height;
        const pxDist = Math.hypot(dx, dy);

        const D = parseFloat(calibDist);
        const L = parseFloat(calibSize);

        if (!D || !L) return alert("Invalid params");

        const f = (pxDist * D) / L;
        setFpx(f);
        localStorage.setItem('fpx', f.toString());
        alert(`Calibrated! f_px = ${f.toFixed(2)}`);
    };

    const measure = () => {
        if (measurePoints.length !== 2 || !image) return alert("Select 2 points");
        if (!fpx) return alert("Calibrate first!");

        const dx = (measurePoints[0].x - measurePoints[1].x) * image.width;
        const dy = (measurePoints[0].y - measurePoints[1].y) * image.height;
        const pxDist = Math.hypot(dx, dy);

        const D = parseFloat(testDist);
        if (!D) return alert("Invalid distance");

        const L = (pxDist * D) / fpx;
        setResult(`${L.toFixed(3)} ${units}`);

        if (truthSize) {
            const truth = parseFloat(truthSize);
            const err = Math.abs(L - truth) / truth * 100;
            setError(`${err.toFixed(2)}%`);
        } else {
            setError(null);
        }
    };

    const saveAnnotated = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'annotated.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Perspective Measurement</h1>
                        <p className="text-gray-500">Assignment 1 • Robust Implementation</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="badge bg-indigo-100 text-indigo-800">Pinhole Model</span>
                        <span className="badge bg-green-100 text-green-800">Self-Calib</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        {/* Source */}
                        <div className="card space-y-4">
                            <h2 className="label">1. Source</h2>
                            <div className="flex gap-2">
                                <button onClick={startWebcam} className="btn btn-secondary flex-1">Webcam</button>
                                <label className="btn btn-primary flex-1 cursor-pointer">
                                    Upload
                                    <input type="file" onChange={handleFile} className="hidden" accept="image/*" />
                                </label>
                            </div>
                            <video ref={videoRef} className="hidden" />
                            {videoRef.current?.srcObject && (
                                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                                    <button onClick={captureWebcam} className="absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-danger">Capture Frame</button>
                                </div>
                            )}
                        </div>

                        {/* Mode */}
                        <div className="card space-y-4">
                            <h2 className="label">2. Mode</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setMode('calib')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'calib' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Calibration
                                </button>
                                <button
                                    onClick={() => setMode('measure')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'measure' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Measurement
                                </button>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Points: {mode === 'calib' ? calibPoints.length : measurePoints.length} / 2</span>
                                <button onClick={() => mode === 'calib' ? setCalibPoints([]) : setMeasurePoints([])} className="text-red-500 hover:underline">Clear Points</button>
                            </div>
                        </div>

                        {/* Params */}
                        <div className="card space-y-4">
                            <h2 className="label">3. Parameters</h2>
                            {mode === 'calib' ? (
                                <>
                                    <div>
                                        <label className="text-xs text-gray-500">Distance (D_calib)</label>
                                        <input type="number" value={calibDist} onChange={e => setCalibDist(e.target.value)} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Known Size (L_ref)</label>
                                        <input type="number" value={calibSize} onChange={e => setCalibSize(e.target.value)} className="input-field" />
                                    </div>
                                    <button onClick={calibrate} className="btn btn-primary w-full">Calibrate f_px</button>
                                    {fpx && <div className="text-center text-sm text-green-600 font-medium mt-2">f_px: {fpx.toFixed(2)}</div>}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs text-gray-500">Distance (D_test)</label>
                                        <input type="number" value={testDist} onChange={e => setTestDist(e.target.value)} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Truth Size (Optional)</label>
                                        <input type="number" value={truthSize} onChange={e => setTruthSize(e.target.value)} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Units</label>
                                        <select value={units} onChange={e => setUnits(e.target.value)} className="input-field">
                                            <option value="cm">cm</option>
                                            <option value="mm">mm</option>
                                            <option value="in">in</option>
                                        </select>
                                    </div>
                                    <button onClick={measure} className="btn btn-primary w-full">Calculate Size</button>
                                </>
                            )}
                        </div>

                        {/* Results */}
                        {mode === 'measure' && result && (
                            <div className="card bg-indigo-50 border-indigo-100">
                                <h2 className="label text-indigo-600">Result</h2>
                                <div className="text-3xl font-bold text-indigo-900">{result}</div>
                                {error && <div className="text-sm text-red-500 mt-1">Error: {error}</div>}
                            </div>
                        )}

                        <button onClick={saveAnnotated} className="btn btn-secondary w-full">Save Annotated PNG</button>
                    </div>

                    {/* Canvas */}
                    <div className="lg:col-span-2">
                        <div className="card p-0 overflow-hidden bg-gray-900 relative">
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                onClick={handleCanvasClick}
                                className="w-full h-auto cursor-crosshair block"
                            />

                            {/* HUD */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                                    f_px: {fpx ? fpx.toFixed(1) : '—'}
                                </span>
                                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                                    {imgDims ? `${imgDims.w}x${imgDims.h}` : 'No Image'}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Click exactly two points to {mode === 'calib' ? 'calibrate' : 'measure'}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

# Commit 34 - Development update

# Commit 36 - Development update

# Commit 42 - Development update

# Commit 75 - Development update

# Commit 76 - Development update

# Commit 84 - Development update

# Commit 103 - Development update

# Commit 106 - Development update

# Commit 120 - Development update
