import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getDisasterNews,
    getCourses,
    enrollCourse,
    getEnrolledCourses,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { getRandomAwarenessVideos } from '../../data/awarenessVideos';
import {
    FiBookOpen,
    FiEdit3,
    FiVideo,
    FiMap,
    FiUser,
    FiAlertTriangle,
    FiRefreshCw,
} from 'react-icons/fi';
import './StudentHome.css';

function StudentHome() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [news, setNews] = useState([]);
    const [extraResources, setExtraResources] = useState([]);
    const [newsMessage, setNewsMessage] = useState('');
    const [courses, setCourses] = useState([]);
    const [videos, setVideos] = useState([]);

    const [loadingNews, setLoadingNews] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingVideos, setLoadingVideos] = useState(true);

    const [enrolling, setEnrolling] = useState(null);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

    useEffect(() => {
        fetchNews();
        fetchCourses();
        fetchEnrolled();
        fetchVideos();
    }, []);

    const fetchNews = async () => {
        try {
            const { data } = await getDisasterNews({ location: 'India', limit: 10 });
            setNews(data.articles || []);
            setExtraResources(data.extraResources || []);
            setNewsMessage(data.message || '');
        } catch (err) {
            console.error('Failed to fetch news:', err.message);
            setNewsMessage('Could not load live disaster news right now.');
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
            setEnrolledCourseIds(data.map((course) => course._id || course));
        } catch (err) {
            console.error('Failed to fetch enrolled courses:', err.message);
        }
    };

    const fetchVideos = async () => {
        setLoadingVideos(true);
        try {
            setVideos(getRandomAwarenessVideos(6));
        } catch (err) {
            console.error('Failed to fetch videos:', err.message);
        } finally {
            setLoadingVideos(false);
        }
    };

    const handleVideoRefresh = async () => {
        await fetchVideos();
    };

    const handleEnroll = async (courseId) => {
        setEnrolling(courseId);
        try {
            await enrollCourse(courseId);
            toast.success('Successfully enrolled! Check My Learning.');
            setEnrolledCourseIds((prev) => [...prev, courseId]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed.');
        } finally {
            setEnrolling(null);
        }
    };

    const renderSkeletonGrid = (count = 3, heightClass = 'h-48') => (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`animate-pulse bg-slate-200 dark:bg-slate-700/50 rounded-xl w-full ${heightClass}`}></div>
            ))}
        </div>
    );

    return (
        <div className="student-home">
            <div className="page-header">
                <div>
                    <h1 className="page-title text-3xl font-bold flex items-center gap-2">Welcome, {user?.name}!</h1>
                    <p className="subtitle text-slate-500 mt-1 dark:text-slate-400">Stay informed. Stay prepared. Stay safe.</p>
                </div>
            </div>

            <div className="quick-actions grid-2">
                <Link to="/student/learning" className="quick-card bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4 group">
                    <span className="quick-icon text-3xl text-primary group-hover:scale-110 transition-transform"><FiBookOpen /></span>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">My Learning</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Continue your enrolled courses</p>
                    </div>
                </Link>
                <Link to="/student/quizzes" className="quick-card bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4 group">
                    <span className="quick-icon text-3xl text-primary group-hover:scale-110 transition-transform"><FiEdit3 /></span>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">My Quizzes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View and attempt assigned quizzes</p>
                    </div>
                </Link>
                <Link to="/student/map" className="quick-card bg-white dark:bg-slate-800 border dark:border-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4 group">
                    <span className="quick-icon text-3xl text-primary group-hover:scale-110 transition-transform"><FiAlertTriangle /></span>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">Live Disaster Map</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track nearby incidents and location alerts</p>
                    </div>
                </Link>
            </div>

            <section className="section my-10">
                <div className="videos-header-row flex items-center justify-between mb-4">
                    <h2 className="section-title text-xl font-bold flex items-center gap-2 dark:text-white">
                        <FiVideo className="text-primary" /> Awareness Videos
                    </h2>
                    <button className="btn btn-outline btn-sm shadow-sm" type="button" onClick={handleVideoRefresh}>
                        <FiRefreshCw /> New Set
                    </button>
                </div>

                <p className="video-topic-label text-sm text-slate-500 dark:text-slate-400 mb-6">Showing random picks from a 100-video awareness library.</p>

                {loadingVideos ? (
                    renderSkeletonGrid(6, 'h-[200px]')
                ) : (
                    <div className="video-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div className="video-wrapper overflow-hidden rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] group hover:shadow-lg hover:border-red-500/30 transition-all duration-300 flex flex-col" key={video.id}>
                                <iframe
                                    className="w-full aspect-video"
                                    src={video.embedUrl}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                                <div className="video-meta p-4 flex-1 flex flex-col justify-between">
                                    <p className="video-title font-semibold text-sm mb-2">{video.title}</p>
                                    <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline">
                                        Watch on YouTube
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="section my-10">
                <h2 className="section-title text-xl font-bold mb-4 flex items-center gap-2 dark:text-white"><FiMap className="text-primary" /> Available Courses</h2>
                {loadingCourses ? (
                    renderSkeletonGrid(3, 'h-[250px]')
                ) : courses.length === 0 ? (
                    <p className="empty-msg text-slate-500 italic">No courses available yet. Check back soon!</p>
                ) : (
                    <div className="courses-grid grid-3">
                        {courses.map((course) => (
                            <div key={course._id} className="course-card card flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                                <div className="course-category">
                                    <span className="badge badge-info">{course.category}</span>
                                    {enrolledCourseIds.includes(course._id) && (
                                        <span className="badge badge-success" style={{ marginLeft: '0.5rem', background: '#e8f5e9', color: '#2e7d32' }}>Enrolled</span>
                                    )}
                                </div>
                                <h3 className="course-title text-lg font-bold mb-2 dark:text-white mt-3 group-hover:text-primary transition-colors">{course.title}</h3>
                                <p className="course-desc text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">{course.description || 'No description provided.'}</p>
                                <p className="course-teacher text-sm flex items-center gap-2 dark:text-slate-300 mb-1"><FiUser /> {course.teacher?.name || 'Unknown'}</p>
                                <p className="course-lessons text-sm flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4"><FiBookOpen /> {course.lessons?.length || 0} lessons</p>

                                {enrolledCourseIds.includes(course._id) ? (
                                    <Link className="btn btn-outline btn-sm w-full justify-center" to={`/student/courses/${course._id}`}>
                                        Start Learning
                                    </Link>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm w-full justify-center"
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

            <section className="section my-10">
                <h2 className="section-title text-xl font-bold mb-4 dark:text-white">Latest Disaster News</h2>
                {loadingNews ? (
                    renderSkeletonGrid(3, 'h-[320px]')
                ) : news.length === 0 ? (
                    <p className="empty-msg text-slate-500 italic">{newsMessage || 'No disaster news available right now.'}</p>
                ) : (
                    <div className="news-grid grid-3">
                        {news.slice(0, 6).map((article, idx) => (
                            <a
                                key={idx}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-card flex flex-col bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:border-orange-500/30 transition-all duration-300"
                            >
                                {article.urlToImage && (
                                    <div className="h-40 overflow-hidden">
                                        <img
                                            src={article.urlToImage}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(event) => {
                                                event.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="news-content p-5 flex flex-col flex-1">
                                    <span className="news-source text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">{article.source?.name}</span>
                                    <h4 className="news-title font-bold text-md mb-2 group-hover:text-orange-500 transition-colors leading-tight">{article.title}</h4>
                                    <p className="news-desc text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{article.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            {extraResources.length > 0 && (
                <section className="section my-10">
                    <h2 className="section-title text-xl font-bold mb-4 dark:text-white">Extra News Resources</h2>
                    <div className="news-grid grid-3">
                        {extraResources.map((article, idx) => (
                            <a
                                key={`${article.url}-${idx}`}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-card p-5 bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))] group hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                            >
                                <div className="news-content flex flex-col h-full">
                                    <span className="news-source text-xs font-bold text-primary uppercase tracking-widest mb-2">{article.source?.name}</span>
                                    <h4 className="news-title font-bold text-md mb-2 group-hover:text-primary transition-colors leading-tight">{article.title}</h4>
                                    <p className="news-desc text-sm text-slate-500 dark:text-slate-400 flex-1">{article.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default StudentHome;
