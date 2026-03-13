/**
 * src/pages/student/StudentHome.jsx - Student Dashboard Home
 * 
 * Displays:
 * 1. Quick action cards linking to My Learning and Quizzes
 * 2. Latest disaster news articles (via backend proxy to NewsAPI)
 * 3. All available courses with enrollment button
 * 4. Embedded disaster awareness videos
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDisasterNews, getCourses, enrollCourse, getEnrolledCourses } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiBookOpen, FiEdit3, FiVideo, FiMap, FiUser } from 'react-icons/fi';
import './StudentHome.css';

function StudentHome() {
    const { user } = useAuth();
    const [news, setNews] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [enrolling, setEnrolling] = useState(null); // ID of course being enrolled
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch news and courses when component mounts
    useEffect(() => {
        fetchNews();
        fetchCourses();
        fetchEnrolled();
    }, []);

    const fetchNews = async () => {
        try {
            const { data } = await getDisasterNews();
            // NewsAPI puts articles in data.articles, our fallback uses the same shape
            setNews(data.articles || []);
        } catch (err) {
            console.error('Failed to fetch news:', err.message);
        } finally {
            setLoadingNews(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const { data } = await getCourses();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch courses:', err.message);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchEnrolled = async () => {
        try {
            const { data } = await getEnrolledCourses();
            setEnrolledCourseIds(data.map(course => course._id || course));
        } catch (err) {
            console.error('Failed to fetch enrolled courses:', err.message);
        }
    };

    const handleEnroll = async (courseId) => {
        setEnrolling(courseId);
        try {
            await enrollCourse(courseId);
            setMessage('Successfully enrolled! Check My Learning.');
            setEnrolledCourseIds(prev => [...prev, courseId]);
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Enrollment failed.');
            setTimeout(() => setMessage(''), 4000);
        } finally {
            setEnrolling(null);
        }
    };

    return (
        <div className="student-home">
            {/* Greeting header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title text-3xl font-bold flex items-center gap-2">Welcome, {user?.name}!</h1>
                    <p className="subtitle text-slate-500 mt-1 dark:text-slate-400">Stay informed. Stay prepared. Stay safe.</p>
                </div>
            </div>

            {message && (
                <div className={`alert ${message.includes('Successfully') ? 'alert-success' : 'alert-error'}`}>
                    {message}
                </div>
            )}

            {/* ── Quick Actions ── */}
            <div className="quick-actions grid-2">
                <Link to="/student/learning" className="quick-card bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4">
                    <span className="quick-icon text-3xl text-primary"><FiBookOpen /></span>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">My Learning</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Continue your enrolled courses</p>
                    </div>
                </Link>
                <Link to="/student/quizzes" className="quick-card bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4">
                    <span className="quick-icon text-3xl text-primary"><FiEdit3 /></span>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">My Quizzes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View and attempt assigned quizzes</p>
                    </div>
                </Link>
            </div>

            {/* ── Disaster Awareness Videos ── */}
            <section className="section my-10">
                <h2 className="section-title text-xl font-bold mb-4 flex items-center gap-2 dark:text-white"><FiVideo className="text-primary" /> Awareness Videos</h2>
                <div className="video-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="video-wrapper">
                        <iframe
                            src="https://www.youtube.com/embed/BLEPakj1YTY"
                            title="Earthquake Safety"
                            frameBorder="0"
                            allowFullScreen
                        />
                        <p>Earthquake Safety Basics</p>
                    </div>
                    <div className="video-wrapper">
                        <iframe
                            src="https://www.youtube.com/embed/pi_nUPcQz_A?si=WhPqaIwpH2_2Wz8K"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                        <p>Flood Preparedness Guide</p>
                    </div>
                    <div className="video-wrapper">
                        <iframe
                            src="https://www.youtube.com/embed/Xgc90CoJbDI?si=4HITIblVW1C2aFB9"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                        <p>Fire Safety & Escape Planning</p>
                    </div>
                </div>
            </section>

            {/* ── Available Courses ── */}
            <section className="section my-10">
                <h2 className="section-title text-xl font-bold mb-4 flex items-center gap-2 dark:text-white"><FiMap className="text-primary" /> Available Courses</h2>
                {loadingCourses ? (
                    <div className="spinner" />
                ) : courses.length === 0 ? (
                    <p className="empty-msg">No courses available yet. Check back soon!</p>
                ) : (
                    <div className="courses-grid grid-3">
                        {courses.map((course) => (
                            <div key={course._id} className="course-card card">
                                <div className="course-category">
                                    <span className="badge badge-info">{course.category}</span>
                                    {enrolledCourseIds.includes(course._id) && (
                                        <span className="badge badge-success" style={{ marginLeft: '0.5rem', background: '#e8f5e9', color: '#2e7d32' }}>Enrolled</span>
                                    )}
                                </div>
                                <h3 className="course-title text-lg font-bold mb-2 dark:text-white mt-3">{course.title}</h3>
                                <p className="course-desc text-sm text-slate-500 dark:text-slate-400 mb-4">{course.description || 'No description provided.'}</p>
                                <p className="course-teacher text-sm flex items-center gap-2 dark:text-slate-300 mb-1"><FiUser /> {course.teacher?.name || 'Unknown'}</p>
                                <p className="course-lessons text-sm flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4"><FiBookOpen /> {course.lessons?.length || 0} lessons</p>

                                {enrolledCourseIds.includes(course._id) ? (
                                    <Link className="btn btn-outline btn-sm" to={`/student/courses/${course._id}`}>
                                        Start Learning
                                    </Link>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleEnroll(course._id)}
                                        disabled={enrolling === course._id}
                                    >
                                        {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Disaster News ── */}
            <section className="section">
                <h2 className="section-title">📰 Latest Disaster News</h2>
                {loadingNews ? (
                    <div className="spinner" />
                ) : (
                    <div className="news-grid grid-3">
                        {news.slice(0, 6).map((article, idx) => (
                            <a
                                key={idx}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-card card"
                            >
                                {article.urlToImage && (
                                    <img
                                        src={article.urlToImage}
                                        alt={article.title}
                                        className="news-img"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <div className="news-content">
                                    <span className="news-source">{article.source?.name}</span>
                                    <h4 className="news-title">{article.title}</h4>
                                    <p className="news-desc">{article.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default StudentHome;
