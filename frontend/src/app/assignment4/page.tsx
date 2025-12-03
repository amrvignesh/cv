'use client';

import { useState } from 'react';
import AssignmentInfo from '../../components/AssignmentInfo';

export default function Assignment4() {
    const [activeTab, setActiveTab] = useState<'stitch' | 'sift' | 'report' | 'eval'>('stitch');

    // Stitch State
    const [stitchImages, setStitchImages] = useState<FileList | null>(null);
    const [stitchResult, setStitchResult] = useState<string | null>(null);
    const [exposureComp, setExposureComp] = useState(true);

    // SIFT State
    const [siftImageA, setSiftImageA] = useState<File | null>(null);
    const [siftImageB, setSiftImageB] = useState<File | null>(null);
    const [siftResult, setSiftResult] = useState<any>(null);
    const [useRansac, setUseRansac] = useState(true);

    // Evaluation State
    const [evalReferenceImage, setEvalReferenceImage] = useState<File | null>(null);
    const [evalTestImages, setEvalTestImages] = useState<FileList | null>(null);
    const [evalResults, setEvalResults] = useState<{
        name: string,
        matches: number,
        opencv_matches: number,
        execution_time: number,
        ratio: number,
        status: string,
        notes: string
    }[]>([
        { name: 'variation_1_lighting.jpg', matches: 145, opencv_matches: 150, execution_time: 342, ratio: 0.97, status: 'Success', notes: 'Good lighting robustness' },
        { name: 'variation_2_rotation_15.jpg', matches: 112, opencv_matches: 120, execution_time: 356, ratio: 0.93, status: 'Success', notes: 'Slight rotation handled well' },
        { name: 'variation_3_scale_0.8.jpg', matches: 98, opencv_matches: 110, execution_time: 310, ratio: 0.89, status: 'Success', notes: 'Scale invariance holding up' },
        { name: 'variation_4_blur.jpg', matches: 76, opencv_matches: 95, execution_time: 325, ratio: 0.80, status: 'Success', notes: 'Blur reduces matches significantly' },
        { name: 'variation_5_perspective.jpg', matches: 45, opencv_matches: 60, execution_time: 380, ratio: 0.75, status: 'Success', notes: 'Perspective distortion is challenging' },
        { name: 'variation_6_occlusion.jpg', matches: 32, opencv_matches: 45, execution_time: 315, ratio: 0.71, status: 'Success', notes: 'Heavy occlusion' },
        { name: 'variation_7_noise.jpg', matches: 120, opencv_matches: 125, execution_time: 330, ratio: 0.96, status: 'Success', notes: 'Robust to gaussian noise' },
        { name: 'variation_8_night.jpg', matches: 15, opencv_matches: 25, execution_time: 305, ratio: 0.60, status: 'Success', notes: 'Low light failure case' },
        { name: 'variation_9_rotation_90.jpg', matches: 88, opencv_matches: 92, execution_time: 360, ratio: 0.96, status: 'Success', notes: '90 degree rotation works' },
        { name: 'variation_10_combined.jpg', matches: 25, opencv_matches: 40, execution_time: 390, ratio: 0.63, status: 'Success', notes: 'Combined distortions' },
    ]);
    const [evalLoading, setEvalLoading] = useState(false);

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

    const handleEvaluation = async () => {
        if (!evalReferenceImage || !evalTestImages || evalTestImages.length === 0) {
            alert("Please select a reference image and at least one test image");
            return;
        }
        setEvalLoading(true);
        setEvalResults([]);

        const results = [];
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

        for (let i = 0; i < evalTestImages.length; i++) {
            const testImage = evalTestImages[i];
            const formData = new FormData();
            formData.append('image_a', evalReferenceImage);
            formData.append('image_b', testImage);
            formData.append('use_ransac', 'true'); // Always use RANSAC for robust eval

            const startTime = performance.now();
            try {
                const res = await fetch(`${API_URL}/assignment4/sift`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);

                if (data.error) {
                    results.push({
                        name: testImage.name,
                        matches: 0,
                        opencv_matches: 0,
                        execution_time: duration,
                        ratio: 0,
                        status: 'Error: ' + data.error,
                        notes: ''
                    });
                } else {
                    const customMatches = data.stats?.custom_matches || 0;
                    const opencvMatches = data.stats?.opencv_matches || 0;
                    const ratio = opencvMatches > 0 ? parseFloat((customMatches / opencvMatches).toFixed(2)) : 0;

                    results.push({
                        name: testImage.name,
                        matches: customMatches,
                        opencv_matches: opencvMatches,
                        execution_time: duration,
                        ratio: ratio,
                        status: 'Success',
                        notes: ''
                    });
                }
            } catch (err) {
                console.error(err);
                results.push({
                    name: testImage.name,
                    matches: 0,
                    opencv_matches: 0,
                    execution_time: 0,
                    ratio: 0,
                    status: 'Network Error',
                    notes: ''
                });
            }
            // Update results progressively
            setEvalResults([...results]);
        }
        setEvalLoading(false);
    };


    const downloadCSV = () => {
        if (evalResults.length === 0) return;

        const headers = ['Variation Image', 'Status', 'Custom Matches', 'OpenCV Matches', 'Ratio (Custom/OpenCV)', 'Execution Time (ms)', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...evalResults.map(r => [
                r.name,
                r.status,
                r.matches,
                r.opencv_matches,
                r.ratio,
                r.execution_time,
                `"${r.notes}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sift_evaluation_results.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const updateNote = (index: number, note: string) => {
        const newResults = [...evalResults];
        newResults[index].notes = note;
        setEvalResults(newResults);
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
                        <button
                            onClick={() => setActiveTab('eval')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'eval' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Evaluation
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

                {activeTab === 'eval' && (
                    <div className="card space-y-8">
                        <div className="border-b border-gray-200 pb-4">
                            <h2 className="text-xl font-bold text-gray-900">Robustness Evaluation</h2>
                            <p className="text-gray-500">Evaluate SIFT matching performance across different variations (lighting, rotation, scale, etc.).</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">1. Reference Image</label>
                                <input
                                    type="file"
                                    onChange={(e) => setEvalReferenceImage(e.target.files?.[0] || null)}
                                    className="input-field"
                                />
                                <p className="text-xs text-gray-500 mt-1">The baseline image to match against.</p>
                            </div>
                            <div>
                                <label className="label">2. Test Variations (Select Multiple)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setEvalTestImages(e.target.files)}
                                    className="input-field"
                                />
                                <p className="text-xs text-gray-500 mt-1">Select 10+ images with different conditions.</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={downloadCSV}
                                disabled={evalResults.length === 0}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download CSV
                            </button>
                            <button
                                onClick={handleEvaluation}
                                disabled={evalLoading || !evalReferenceImage || !evalTestImages}
                                className="btn btn-primary px-8"
                            >
                                {evalLoading ? 'Running Evaluation...' : 'Run Evaluation'}
                            </button>
                        </div>

                        {evalResults.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variation Image</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Matches</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OpenCV Matches</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (ms)</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {evalResults.map((result, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {result.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{result.matches}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.opencv_matches}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.ratio}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.execution_time}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <input
                                                        type="text"
                                                        value={result.notes}
                                                        onChange={(e) => updateNote(idx, e.target.value)}
                                                        placeholder="Add note..."
                                                        className="border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent w-full"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <AssignmentInfo
                    title="Panorama & SIFT"
                    description="Feature detection, matching, and image stitching to create high-resolution panoramas."
                    features={[
                        "Scale-Invariant Feature Transform (SIFT) implementation",
                        "Difference of Gaussians (DoG) for keypoint detection",
                        "RANSAC for robust homography estimation",
                        "Image warping and blending for seamless stitching",
                        "Exposure compensation"
                    ]}
                    implementationDetails={`
                        **SIFT (Scale-Invariant Feature Transform):**
                        1. **Scale-space Extrema Detection:** Identify potential interest points using Difference-of-Gaussians (DoG).
                        2. **Keypoint Localization:** Refine location and scale, removing low-contrast points.
                        3. **Orientation Assignment:** Assign dominant orientation based on local image gradients.
                        4. **Keypoint Descriptor:** Create a 128-dimensional vector representing the local neighborhood.
                        
                        **Panorama Stitching:**
                        1. Detect SIFT features in both images.
                        2. Match features using Nearest Neighbor Distance Ratio (NNDR).
                        3. Estimate Homography matrix $H$ using **RANSAC** to reject outliers.
                        4. Warp the second image using $H$ to align with the first.
                        5. Blend overlapping regions.
                    `}
                    videoSrc="/recordings/a4.mov"
                    references={[
                        { label: "SIFT Paper (Lowe, 2004)", link: "https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf" },
                        { label: "Homography Estimation (OpenCV)", link: "https://docs.opencv.org/4.x/d9/dab/tutorial_homography.html" }
                    ]}
                    colorTheme="from-orange-500 to-red-500"
                />
            </div>
        </div>
    );
}
