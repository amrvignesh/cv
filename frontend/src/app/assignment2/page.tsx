'use client';

import { useState } from 'react';

export default function Assignment2() {
    const [activeTab, setActiveTab] = useState<'match' | 'deblur'>('match');

    // Match State
    const [matchImage, setMatchImage] = useState<File | null>(null);
    const [templateImage, setTemplateImage] = useState<File | null>(null);
    const [matchPreview, setMatchPreview] = useState<string | null>(null);
    const [templatePreview, setTemplatePreview] = useState<string | null>(null);

    // Advanced Match Params
    const [matchThreshold, setMatchThreshold] = useState(0.8);
    const [nmsThreshold, setNmsThreshold] = useState(0.4);
    const [scaleMin, setScaleMin] = useState(0.8);
    const [scaleMax, setScaleMax] = useState(1.2);
    const [scaleSteps, setScaleSteps] = useState(5);
    const [rotation, setRotation] = useState(false);
    const [matchMethod, setMatchMethod] = useState('cv.TM_CCOEFF_NORMED');

    const [matchResult, setMatchResult] = useState<any>(null);

    // Deblur State
    const [deblurImage, setDeblurImage] = useState<File | null>(null);
    const [deblurPreview, setDeblurPreview] = useState<string | null>(null);
    const [sigma, setSigma] = useState(3.0);
    const [ksize, setKsize] = useState(19);
    const [mode, setMode] = useState('wiener');
    const [kWiener, setKWiener] = useState(0.01);
    const [regionBlur, setRegionBlur] = useState(false);
    const [deblurResult, setDeblurResult] = useState<any>(null);

    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'match' | 'template' | 'deblur') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (type === 'match') {
                    setMatchImage(file);
                    setMatchPreview(ev.target?.result as string);
                    setMatchResult(null);
                } else if (type === 'template') {
                    setTemplateImage(file);
                    setTemplatePreview(ev.target?.result as string);
                } else {
                    setDeblurImage(file);
                    setDeblurPreview(ev.target?.result as string);
                    setDeblurResult(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMatch = async () => {
        if (!matchImage || !templateImage) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('image', matchImage);
        formData.append('template', templateImage);
        formData.append('threshold', matchThreshold.toString());
        formData.append('nms_threshold', nmsThreshold.toString());
        formData.append('scale_min', scaleMin.toString());
        formData.append('scale_max', scaleMax.toString());
        formData.append('scale_steps', scaleSteps.toString());
        formData.append('rotation', rotation.toString());
        formData.append('method', matchMethod);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment2/match`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setMatchResult(data);
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        } finally {
            setLoading(false);
        }
    };

    const handleDeblur = async () => {
        if (!deblurImage) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('image', deblurImage);
        formData.append('sigma', sigma.toString());
        formData.append('ksize', ksize.toString());
        formData.append('mode', mode);
        formData.append('k_wiener', kWiener.toString());
        formData.append('region_blur', regionBlur.toString());

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment2/deblur`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setDeblurResult(data);
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Matching & Deblurring</h1>
                        <p className="text-gray-500">Assignment 2 • Robust Implementation</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('match')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'match' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Template Matching
                        </button>
                        <button
                            onClick={() => setActiveTab('deblur')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'deblur' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Fourier Deblurring
                        </button>
                    </div>
                </header>

                {activeTab === 'match' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Settings */}
                        <div className="space-y-6">
                            <div className="card space-y-4">
                                <h2 className="label">1. Images</h2>
                                <div>
                                    <label className="text-xs text-gray-500">Scene Image</label>
                                    <input type="file" onChange={(e) => handleImageUpload(e, 'match')} className="input-field" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Template Image</label>
                                    <input type="file" onChange={(e) => handleImageUpload(e, 'template')} className="input-field" />
                                </div>
                            </div>

                            <div className="card space-y-4">
                                <h2 className="label">2. Parameters</h2>
                                <div>
                                    <label className="text-xs text-gray-500 flex justify-between">
                                        <span>Match Threshold</span>
                                        <span>{matchThreshold}</span>
                                    </label>
                                    <input type="range" min="0.1" max="1.0" step="0.05" value={matchThreshold} onChange={(e) => setMatchThreshold(parseFloat(e.target.value))} className="w-full" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 flex justify-between">
                                        <span>NMS Threshold</span>
                                        <span>{nmsThreshold}</span>
                                    </label>
                                    <input type="range" min="0.1" max="1.0" step="0.05" value={nmsThreshold} onChange={(e) => setNmsThreshold(parseFloat(e.target.value))} className="w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Scale Min</label>
                                        <input type="number" step="0.1" value={scaleMin} onChange={e => setScaleMin(parseFloat(e.target.value))} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Scale Max</label>
                                        <input type="number" step="0.1" value={scaleMax} onChange={e => setScaleMax(parseFloat(e.target.value))} className="input-field" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={rotation} onChange={e => setRotation(e.target.checked)} className="rounded text-indigo-600" />
                                    Rotation Invariance
                                </label>
                                <button onClick={handleMatch} disabled={loading || !matchImage || !templateImage} className="btn btn-primary w-full">
                                    {loading ? 'Processing...' : 'Run Matching'}
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="lg:col-span-2 space-y-6">
                            {matchResult?.image ? (
                                <div className="card">
                                    <h2 className="label mb-4">Results</h2>
                                    <img src={matchResult.image} alt="Result" className="w-full rounded-lg border border-gray-200" />
                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Detections ({matchResult.detections?.length || 0})</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {matchResult.detections?.map((d: any, i: number) => (
                                                <span key={i} className="badge bg-green-100 text-green-800 border border-green-200">
                                                    Score: {(d.score * 100).toFixed(0)}%
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="card flex items-center justify-center min-h-[200px] bg-gray-50">
                                        {matchPreview ? <img src={matchPreview} className="max-h-48 object-contain" /> : <span className="text-gray-400">Scene Preview</span>}
                                    </div>
                                    <div className="card flex items-center justify-center min-h-[200px] bg-gray-50">
                                        {templatePreview ? <img src={templatePreview} className="max-h-48 object-contain" /> : <span className="text-gray-400">Template Preview</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Settings */}
                        <div className="space-y-6">
                            <div className="card space-y-4">
                                <h2 className="label">1. Image</h2>
                                <input type="file" onChange={(e) => handleImageUpload(e, 'deblur')} className="input-field" />
                            </div>

                            <div className="card space-y-4">
                                <h2 className="label">2. Parameters</h2>
                                <div>
                                    <label className="text-xs text-gray-500">Sigma (Blur Amount)</label>
                                    <input type="number" value={sigma} onChange={e => setSigma(parseFloat(e.target.value))} className="input-field" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Kernel Size</label>
                                    <input type="number" value={ksize} onChange={e => setKsize(parseInt(e.target.value))} className="input-field" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Mode</label>
                                    <select value={mode} onChange={e => setMode(e.target.value)} className="input-field">
                                        <option value="wiener">Wiener Deconvolution</option>
                                        <option value="inverse">Inverse Filtering</option>
                                    </select>
                                </div>
                                {mode === 'wiener' && (
                                    <div>
                                        <label className="text-xs text-gray-500">SNR (K)</label>
                                        <input type="number" step="0.001" value={kWiener} onChange={e => setKWiener(parseFloat(e.target.value))} className="input-field" />
                                    </div>
                                )}
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={regionBlur} onChange={e => setRegionBlur(e.target.checked)} className="rounded text-indigo-600" />
                                    Region-Only Blur (Privacy)
                                </label>
                                <button onClick={handleDeblur} disabled={loading || !deblurImage} className="btn btn-primary w-full">
                                    {loading ? 'Processing...' : 'Run Deblur'}
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="lg:col-span-2">
                            {deblurResult?.original ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="card p-4">
                                            <h3 className="label mb-2">Original</h3>
                                            <img src={deblurResult.original} className="w-full rounded" />
                                        </div>
                                        <div className="card p-4">
                                            <h3 className="label mb-2">Blurred (Simulated)</h3>
                                            <img src={deblurResult.blurred} className="w-full rounded" />
                                        </div>
                                    </div>
                                    <div className="card p-4 border-indigo-200 bg-indigo-50">
                                        <h3 className="label text-indigo-600 mb-2">Restored Result</h3>
                                        <img src={deblurResult.recovered} className="w-full rounded shadow-sm" />
                                    </div>
                                </div>
                            ) : (
                                <div className="card flex items-center justify-center min-h-[400px] bg-gray-50">
                                    {deblurPreview ? <img src={deblurPreview} className="max-h-96 object-contain" /> : <span className="text-gray-400">Upload an image to see results</span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

# Commit 24 - Development update

# Commit 38 - Development update

# Commit 41 - Development update

# Commit 44 - Development update

# Commit 49 - Development update

# Commit 80 - Development update

# Commit 91 - Development update

# Commit 127 - Development update

# Commit 130 - Development update

# Commit 134 - Development update

# Commit 138 - Development update

# Development update 146 - 2025-12-03

# Development update 156 - 2025-12-03

# Development update 180 - 2025-12-03
