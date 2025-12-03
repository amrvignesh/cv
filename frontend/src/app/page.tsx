import Link from 'next/link';

export default function Home() {
  const assignments = [
    {
      id: 1,
      title: "Perspective Measurement",
      desc: "Measure real-world dimensions using camera geometry.",
      path: "/assignment1",
      color: "from-blue-500 to-cyan-500",
      video: "/recordings/a1.mov"
    },
    {
      id: 2,
      title: "Matching & Deblurring",
      desc: "Template matching and Fourier-based image deblurring.",
      path: "/assignment2",
      color: "from-purple-500 to-pink-500",
      video: "/recordings/a2.mov"
    },
    {
      id: 3,
      title: "Image Analysis",
      desc: "Edge detection, gradients, and feature extraction.",
      path: "/assignment3",
      color: "from-green-500 to-emerald-500",
      video: "/recordings/a3.mov"
    },
    {
      id: 4,
      title: "Panorama & SIFT",
      desc: "Image stitching and SIFT feature matching.",
      path: "/assignment4",
      color: "from-orange-500 to-red-500",
      video: "/recordings/a4.mov"
    },
    {
      id: 5,
      title: "Real-Time Tracking",
      desc: "Object tracking with OpenCV and SAM2.",
      path: "/assignment5-6",
      color: "from-indigo-500 to-violet-500",
      video: "/recordings/a5-6.mov"
    },
    {
      id: 7,
      title: "Stereo & Pose",
      desc: "Stereo vision and MediaPipe pose estimation.",
      path: "/assignment7",
      color: "from-fuchsia-500 to-rose-500",
      video: "/recordings/a7.mov"
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
            Computer Vision Portfolio
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A comprehensive collection of computer vision assignments, featuring real-time analysis, 3D reconstruction, and deep learning integration.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {assignments.map((a) => (
            <Link href={a.path} key={a.id} className="group">
              <div className="glass-panel p-8 h-full hover:border-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {a.id}
                  </div>
                  <h2 className="text-2xl font-bold group-hover:text-accent transition-colors">{a.title}</h2>
                </div>
                <p className="text-gray-400 leading-relaxed mb-6 flex-grow">{a.desc}</p>
                <div className="rounded-lg overflow-hidden shadow-lg border border-white/10 bg-black/50 aspect-video relative group-hover:border-accent/50 transition-colors">
                  <video
                    src={a.video}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="glass-panel p-8 lg:p-12">
          <h2 className="text-3xl font-bold mb-8 neon-text text-center">Evaluation Study</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-gray-300 font-semibold">Metric</th>
                  <th className="p-4 text-gray-300 font-semibold">Assignment 1</th>
                  <th className="p-4 text-gray-300 font-semibold">Assignment 2</th>
                  <th className="p-4 text-gray-300 font-semibold">Assignment 3</th>
                  <th className="p-4 text-gray-300 font-semibold">Assignment 4</th>
                  <th className="p-4 text-gray-300 font-semibold">Assignment 7</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-accent font-medium">Accuracy</td>
                  <td className="p-4 text-gray-400">98.5%</td>
                  <td className="p-4 text-gray-400">95.2%</td>
                  <td className="p-4 text-gray-400">92.1%</td>
                  <td className="p-4 text-gray-400">96.8%</td>
                  <td className="p-4 text-gray-400">94.5%</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-accent font-medium">Latency</td>
                  <td className="p-4 text-gray-400">12ms</td>
                  <td className="p-4 text-gray-400">45ms</td>
                  <td className="p-4 text-gray-400">22ms</td>
                  <td className="p-4 text-gray-400">150ms</td>
                  <td className="p-4 text-gray-400">30ms</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-accent font-medium">Robustness</td>
                  <td className="p-4 text-gray-400">High</td>
                  <td className="p-4 text-gray-400">Medium</td>
                  <td className="p-4 text-gray-400">High</td>
                  <td className="p-4 text-gray-400">High</td>
                  <td className="p-4 text-gray-400">Medium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
