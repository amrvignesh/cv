import React from 'react';

interface Reference {
    label: string;
    link?: string;
}

interface AssignmentInfoProps {
    title: string;
    description: string;
    features: string[];
    implementationDetails: string;
    videoSrc: string;
    references?: Reference[];
    colorTheme?: string;
}

export default function AssignmentInfo({
    title,
    description,
    features,
    implementationDetails,
    videoSrc,
    references,
    colorTheme = "from-indigo-400 to-cyan-400"
}: AssignmentInfoProps) {
    return (
        <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h2 className={`text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r ${colorTheme}`}>
                            Academic Details
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {description}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                            <span className={`w-2 h-8 rounded-full bg-gradient-to-b ${colorTheme}`}></span>
                            Key Features
                        </h3>
                        <ul className="space-y-3">
                            {features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-600">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorTheme} flex-shrink-0`}></span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                            <span className={`w-2 h-8 rounded-full bg-gradient-to-b ${colorTheme}`}></span>
                            Implementation Logic
                        </h3>
                        <div className="prose prose-lg max-w-none text-gray-600">
                            <p className="whitespace-pre-line leading-relaxed">{implementationDetails}</p>
                        </div>
                    </div>

                    {references && references.length > 0 && (
                        <div className="pt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                References & Resources
                            </h3>
                            <ul className="space-y-3">
                                {references.map((ref, idx) => (
                                    <li key={idx}>
                                        {ref.link ? (
                                            <a
                                                href={ref.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors`}
                                            >
                                                <span className={`bg-gradient-to-r ${colorTheme} bg-clip-text text-transparent group-hover:text-gray-900 transition-all`}>
                                                    {ref.label}
                                                </span>
                                                <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <span className="text-gray-600">{ref.label}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-2 overflow-hidden relative group rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                            <video
                                src={videoSrc}
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                                loop
                                muted
                            />
                            <div className="absolute inset-0 pointer-events-none border border-gray-200 rounded-lg"></div>
                        </div>
                        <div className="p-4 text-center">
                            <p className={`text-sm font-medium bg-gradient-to-r ${colorTheme} bg-clip-text text-transparent`}>
                                Demonstration Video
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
