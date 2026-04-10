import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiShield, FiUsers, FiMap } from 'react-icons/fi';

const Home = () => {
    const { user } = useAuth();
    const dashboardLink = user?.role === 'teacher' ? '/teacher' : '/student';

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] flex flex-col font-sans">
            {/* Navigation / Header */}
            <header className="px-6 py-4 flex items-center justify-between bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center text-white">
                        <FiShield size={18} />
                    </div>
                    <span className="text-xl font-bold tracking-tight">DisasterLearn</span>
                </div>
                <nav className="flex items-center gap-4">
                    {user ? (
                        <Link to={dashboardLink} className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login/student" className="text-sm font-medium hover:text-[rgb(var(--primary))] transition-colors">
                                Student Portal
                            </Link>
                            <Link to="/login/teacher" className="text-sm font-medium hover:text-[rgb(var(--primary))] transition-colors">
                                Teacher Portal
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 dark:bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl relative z-10 leading-tight">
                    Disaster Preparedness Education <br className="hidden md:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                        for Schools & Colleges
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-[rgb(var(--text-muted))] max-w-2xl mb-10 relative z-10">
                    Empowering the next generation with life-saving knowledge. Interactive courses, real-time disaster maps, and comprehensive safety group management.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
                    {user ? (
                        <Link to={dashboardLink} className="btn btn-primary px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-red-500/25">
                            Enter Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login/student" className="btn btn-primary px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-red-500/25 transition-all">
                                I am a Student
                            </Link>
                            <Link to="/login/teacher" className="btn btn-outline px-8 py-3 text-lg rounded-full bg-[rgb(var(--surface))] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                I am a Teacher
                            </Link>
                        </>
                    )}
                </div>

                {/* Features Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto relative z-10 text-left">
                    <div className="card border-[rgb(var(--border))] shadow-sm hover:border-red-500/30 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4 group-hover:scale-110 transition-transform">
                            <FiBook size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Engaging Courses</h3>
                        <p className="text-[rgb(var(--text-muted))] text-sm">Interactive learning modules designed specifically for varying age groups to teach essential survival and preparedness skills.</p>
                    </div>
                    <div className="card border-[rgb(var(--border))] shadow-sm hover:border-orange-500/30 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                            <FiMap size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Live Disaster Map</h3>
                        <p className="text-[rgb(var(--text-muted))] text-sm">Real-time alerts and geographical tracking to ensure students and faculty are aware of ongoing risks.</p>
                    </div>
                    <div className="card border-[rgb(var(--border))] shadow-sm hover:border-blue-500/30 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                            <FiUsers size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Group Management</h3>
                        <p className="text-[rgb(var(--text-muted))] text-sm">Instructors can manage classes, monitor student progress, and ensure everyone completes their training.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
