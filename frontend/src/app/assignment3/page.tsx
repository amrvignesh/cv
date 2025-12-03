'use client';

import { useState } from 'react';

export default function Assignment3() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [task, setTask] = useState('gradient');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Params
    const [params, setParams] = useState<any>({
        ksize: 3,
        sigma: 1.0,
        low: 50,
        high: 150,
        block: 2,
        k: 0.04,
        thresh: 100,
        edge_boost: false,
        auto_threshold: false,
        morph_op: 'none'
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleProcess = async () => {
        if (!image) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('task', task);

        Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
        });

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment3/process`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        } finally {
            setLoading(false);
        }
    };

    const updateParam = (key: string, value: any) => {
        setParams({ ...params, [key]: value });
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Image Analysis Suite</h1>
                        <p className="text-gray-500">Assignment 3 • Robust Implementation</p>
                    </div>
                    <button className="btn btn-secondary" disabled>Batch Export (Coming Soon)</button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings */}
                    <div className="space-y-6">
                        <div className="card space-y-4">
                            <h2 className="label">1. Source</h2>
                            <input type="file" onChange={handleImageUpload} className="input-field" />
                        </div>

                        <div className="card space-y-4">
                            <h2 className="label">2. Task & Parameters</h2>
                            <div>
                                <label className="text-xs text-gray-500">Task Mode</label>
                                <select value={task} onChange={e => setTask(e.target.value)} className="input-field">
                                    <option value="gradient">Gradient Magnitude</option>
                                    <option value="log">Laplacian of Gaussian (LoG)</option>
                                    <option value="edges">Canny Edges</option>
                                    <option value="corners">Harris Corners</option>
                                    <option value="boundary">Boundary Detection</option>
                                    <option value="aruco">ArUco Detection</option>
                                </select>
                            </div>

                            {/* Dynamic Params */}
                            {(task === 'gradient' || task === 'log' || task === 'corners') && (
                                <div>
                                    <label className="text-xs text-gray-500">Kernel Size: {params.ksize}</label>
                                    <input type="number" value={params.ksize} onChange={e => updateParam('ksize', e.target.value)} className="input-field" />
                                </div>
                            )}

                            {task === 'log' && (
                                <div>
                                    <label className="text-xs text-gray-500">Sigma: {params.sigma}</label>
                                    <input type="number" step="0.1" value={params.sigma} onChange={e => updateParam('sigma', e.target.value)} className="input-field" />
                                </div>
                            )}

                            {task === 'edges' && (
                                <>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={params.auto_threshold} onChange={e => updateParam('auto_threshold', e.target.checked)} className="rounded text-indigo-600" />
                                        Auto Thresholds (Otsu)
                                    </label>
                                    {!params.auto_threshold && (
                                        <>
                                            <div>
                                                <label className="text-xs text-gray-500 flex justify-between">
                                                    <span>Low Threshold</span>
                                                    <span>{params.low}</span>
                                                </label>
                                                <input type="range" min="0" max="255" value={params.low} onChange={e => updateParam('low', e.target.value)} className="w-full" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 flex justify-between">
                                                    <span>High Threshold</span>
                                                    <span>{params.high}</span>
                                                </label>
                                                <input type="range" min="0" max="255" value={params.high} onChange={e => updateParam('high', e.target.value)} className="w-full" />
                                            </div>
                                        </>
                                    )}
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={params.edge_boost} onChange={e => updateParam('edge_boost', e.target.checked)} className="rounded text-indigo-600" />
                                        Edge Boost (Pre-sharpening)
                                    </label>
                                </>
                            )}

                            {task === 'corners' && (
                                <>
                                    <div>
                                        <label className="text-xs text-gray-500">Block Size: {params.block}</label>
                                        <input type="number" value={params.block} onChange={e => updateParam('block', e.target.value)} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">K: {params.k}</label>
                                        <input type="number" step="0.01" value={params.k} onChange={e => updateParam('k', e.target.value)} className="input-field" />
                                    </div>
                                </>
                            )}

                            {task === 'boundary' && (
                                <div>
                                    <label className="text-xs text-gray-500">Morphological Op</label>
                                    <select value={params.morph_op} onChange={e => updateParam('morph_op', e.target.value)} className="input-field">
                                        <option value="none">None</option>
                                        <option value="close">Closing (Fill Gaps)</option>
                                        <option value="open">Opening (Remove Noise)</option>
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleProcess}
                                disabled={loading || !image}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Processing...' : 'Run Analysis'}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card p-4">
                                <h3 className="label mb-2">Original</h3>
                                {preview ? (
                                    <img src={preview} alt="Original" className="w-full h-auto rounded" />
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="card p-4">
                                <h3 className="label mb-2 text-indigo-600">Processed</h3>
                                {result && result.error ? (
                                    <div className="text-red-500 text-sm">{result.error}</div>
                                ) : result && result.image ? (
                                    <img src={result.image} alt="Processed" className="w-full h-auto rounded shadow-sm" />
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded">
                                        No Result
                                    </div>
                                )}
                            </div>
                        </div>

                        {result && result.info && Object.keys(result.info).length > 0 && (
                            <div className="card bg-gray-50">
                                <h3 className="label mb-2">Analysis Info</h3>
                                <pre className="text-xs text-gray-600 overflow-x-auto font-mono">{JSON.stringify(result.info, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
