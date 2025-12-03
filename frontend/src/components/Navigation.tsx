'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const assignments = [
        { id: 'assignment1', label: '1. Perspective' },
        { id: 'assignment2', label: '2. Matching' },
        { id: 'assignment3', label: '3. Analysis' },
        { id: 'assignment4', label: '4. Panorama' },
        { id: 'assignment5-6', label: '5-6. Tracking' },
        { id: 'assignment7', label: '7. Stereo & Pose' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo / Title */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-indigo-500/30 transition-all">
                                CV
                            </div>
                            <span className={`font-bold text-lg tracking-tight ${isScrolled || pathname !== '/' ? 'text-gray-900' : 'text-white'} transition-colors`}>
                                CSC8830: Computer Vision
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors hover:text-indigo-500 ${isScrolled || pathname !== '/' ? 'text-gray-600' : 'text-gray-200'}`}
                        >
                            Home
                        </Link>

                        <div className="relative group">
                            <button
                                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-indigo-500 ${isScrolled || pathname !== '/' ? 'text-gray-600' : 'text-gray-200'}`}
                            >
                                Assignments
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden w-56 py-2">
                                    {assignments.map((assignment) => (
                                        <Link
                                            key={assignment.id}
                                            href={`/${assignment.id}`}
                                            className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        >
                                            {assignment.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-lg ${isScrolled || pathname !== '/' ? 'text-gray-600' : 'text-white'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        <Link
                            href="/"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <div className="border-t border-gray-100 my-2 pt-2">
                            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assignments</p>
                            {assignments.map((assignment) => (
                                <Link
                                    key={assignment.id}
                                    href={`/${assignment.id}`}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {assignment.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
