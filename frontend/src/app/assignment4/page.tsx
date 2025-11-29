'use client';

import { useState } from 'react';

export default function Assignment4() {
    const [activeTab, setActiveTab] = useState<'stitch' | 'sift' | 'report'>('stitch');

    // Stitch State
    const [stitchImages, setStitchImages] = useState<FileList | null>(null);
    const [stitchResult, setStitchResult] = useState<string | null>(null);
    const [exposureComp, setExposureComp] = useState(true);

    // SIFT State
    const [siftImageA, setSiftImageA] = useState<File | null>(null);
    const [siftImageB, setSiftImageB] = useState<File | null>(null);
    const [siftResult, setSiftResult] = useState<any>(null);
    const [useRansac, setUseRansac] = useState(true);

    const [loading, setLoading] = useState(false);

    const handleStitch = async () => {
        if (!stitchImages || stitchImages.length < 2) {
            alert("Please select at least 2 images");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        for (let i = 0; i < stitchImages.length; i++) {
            formData.append('images', stitchImages[i]);
        }
        formData.append('exposure_comp', exposureComp.toString());

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment4/stitch`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else setStitchResult(data.panorama);
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        } finally {
            setLoading(false);
        }
    };

    const handleSift = async () => {
        if (!siftImageA || !siftImageB) {
            alert("Please select 2 images");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('image_a', siftImageA);
        formData.append('image_b', siftImageB);
        formData.append('use_ransac', useRansac.toString());

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${API_URL}/assignment4/sift`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else setSiftResult(data);
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
                        <h1 className="text-3xl font-bold text-gray-900">Panorama & SIFT</h1>
                        <p className="text-gray-500">Assignment 4 • Robust Implementation</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('stitch')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stitch' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Stitching
                        </button>
                        <button
                            onClick={() => setActiveTab('sift')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sift' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            SIFT Matching
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'report' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Report
                        </button>
                    </div>
                </header>

                {activeTab === 'stitch' && (
                    <div className="card space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 w-full">
                                <label className="label">Upload Overlapping Images (min 2)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setStitchImages(e.target.files)}
                                    className="input-field"
                                />
                            </div>
                            <div className="flex items-center gap-4 pb-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={exposureComp} onChange={e => setExposureComp(e.target.checked)} className="rounded text-indigo-600" />
                                    Exposure Compensation
                                </label>
                                <button
                                    onClick={handleStitch}
                                    disabled={loading || !stitchImages || stitchImages.length < 2}
                                    className="btn btn-primary"
                                >
                                    {loading ? 'Stitching...' : 'Create Panorama'}
                                </button>
                            </div>
                        </div>

                        {stitchResult && (
                            <div className="border-t border-gray-200 pt-8">
                                <h3 className="label text-indigo-600 mb-4">Result</h3>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                    <img src={stitchResult} alt="Panorama" className="w-full h-auto" />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <a href={stitchResult} download="panorama.jpg" className="btn btn-secondary">Download Panorama</a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'sift' && (
                    <div className="card space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Image A</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSiftImageA(e.target.files?.[0] || null)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="label">Image B</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSiftImageB(e.target.files?.[0] || null)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={useRansac} onChange={e => setUseRansac(e.target.checked)} className="rounded text-indigo-600" />
                                Use RANSAC (Remove Outliers)
                            </label>
                            <button
                                onClick={handleSift}
                                disabled={loading || !siftImageA || !siftImageB}
                                className="btn btn-primary px-8"
                            >
                                {loading ? 'Processing...' : 'Run SIFT'}
                            </button>
                        </div>

                        {siftResult && siftResult.error ? (
                            <div className="text-red-500">{siftResult.error}</div>
                        ) : siftResult && siftResult.stats ? (
                            <div className="space-y-8 border-t border-gray-200 pt-8">
                                <div>
                                    <h3 className="label text-indigo-600 mb-4 flex justify-between">
                                        Custom SIFT Implementation
                                        <span className="badge bg-indigo-100 text-indigo-800">{siftResult.stats.custom_matches} matches</span>
                                    </h3>
                                    <img src={siftResult.custom} alt="Custom SIFT" className="w-full rounded-lg border border-gray-200" />
                                </div>
                                <div>
                                    <h3 className="label text-gray-600 mb-4 flex justify-between">
                                        OpenCV SIFT Reference
                                        <span className="badge bg-gray-100 text-gray-800">{siftResult.stats.opencv_matches} matches</span>
                                    </h3>
                                    <img src={siftResult.opencv} alt="OpenCV SIFT" className="w-full rounded-lg border border-gray-200" />
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {activeTab === 'report' && (
                    <div className="card prose max-w-none">
                        <h2>Assignment 4 Report</h2>
                        <h3>1. SIFT Feature Matching</h3>
                        <p>
                            We implemented Scale-Invariant Feature Transform (SIFT) to detect and describe local features in images.
                            Key steps included:
                        </p>
                        <ul>
                            <li>Scale-space extrema detection using Difference of Gaussians (DoG).</li>
                            <li>Keypoint localization and filtering (removing low contrast/edge responses).</li>
                            <li>Orientation assignment for rotation invariance.</li>
                            <li>Keypoint descriptor generation (128-dim vector).</li>
                        </ul>

                        <h3>2. Panorama Stitching</h3>
                        <p>
                            The stitching pipeline uses SIFT features to find correspondences between overlapping images.
                            We compute a Homography matrix using RANSAC to align images robustly.
                            Finally, we warp images onto a common canvas and blend them to create a seamless panorama.
                        </p>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 not-prose text-sm text-yellow-800">
                            <strong>Note:</strong> This is a static report placeholder. In a real submission, this would contain dynamic metrics and analysis generated from the backend.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

# Commit 21 - Development update

# Commit 48 - Development update

# Commit 64 - Development update

# Commit 68 - Development update

# Commit 79 - Development update

# Commit 96 - Development update
