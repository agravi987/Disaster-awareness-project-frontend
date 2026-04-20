import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getDisasterNews,
    getCourses,
    enrollCourse,
    getEnrolledCourses,
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
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
    FiBell,
    FiCheckCircle,
    FiClock,
    FiExternalLink,
    FiActivity,
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
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const [loadingNews, setLoadingNews] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    const [enrolling, setEnrolling] = useState(null);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
    const [markingNotificationId, setMarkingNotificationId] = useState(null);
    const [markingAllNotifications, setMarkingAllNotifications] = useState(false);
    const [notificationLiveStatus, setNotificationLiveStatus] = useState('connecting');
    const previousUnreadRef = useRef(0);

    useEffect(() => {
        fetchNews();
        fetchCourses();
        fetchEnrolled();
        fetchVideos();
        fetchNotifications();

        const pollTimer = setInterval(() => {
            fetchNotifications({ silent: true });
        }, 60000);

        return () => clearInterval(pollTimer);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setNotificationLiveStatus('offline');
            return;
        }

        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const streamUrl = `${base}/notifications/stream?token=${encodeURIComponent(token)}`;
        let source = null;
        let reconnectTimer = null;

        const connect = () => {
            setNotificationLiveStatus('connecting');
            source = new EventSource(streamUrl);

            source.onopen = () => {
                setNotificationLiveStatus('live');
            };

            source.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data || '{}');
                    if (payload.type === 'notification:new') {
                        fetchNotifications({ silent: true });
                        toast.info(payload.notification?.title || 'New notification update');
                    }
                } catch {
                    // ignore malformed stream payloads
                }
            };

            source.onerror = () => {
                setNotificationLiveStatus('reconnecting');
                source?.close();
                reconnectTimer = setTimeout(connect, 4000);
            };
        };

        connect();

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            source?.close();
        };
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

    const fetchNotifications = async ({ silent = false } = {}) => {
        if (!silent) setLoadingNotifications(true);
        try {
            const { data } = await getMyNotifications({ limit: 8 });
            const incoming = data.notifications || [];
            const incomingUnread = data.unreadCount || 0;
            setNotifications(incoming);
            setUnreadNotifications(incomingUnread);

            if (silent && previousUnreadRef.current > 0 && incomingUnread > previousUnreadRef.current) {
                toast.info(`You have ${incomingUnread} unread notification updates.`);
            }
            previousUnreadRef.current = incomingUnread;
        } catch (err) {
            console.error('Failed to fetch notifications:', err.message);
        } finally {
            if (!silent) setLoadingNotifications(false);
        }
    };

    const handleMarkNotificationRead = async (notificationId) => {
        if (!notificationId) return;
        setMarkingNotificationId(notificationId);
        try {
            const { data } = await markNotificationRead(notificationId);
            const updatedUnread = typeof data.unreadCount === 'number' ? data.unreadCount : 0;
            setUnreadNotifications(updatedUnread);
            previousUnreadRef.current = updatedUnread;
            setNotifications((prev) =>
                prev.map((item) =>
                    item._id === notificationId ? { ...item, isRead: true } : item
                )
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark notification as read.');
        } finally {
            setMarkingNotificationId(null);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        setMarkingAllNotifications(true);
        try {
            await markAllNotificationsRead();
            setUnreadNotifications(0);
            previousUnreadRef.current = 0;
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            toast.success('All notifications marked as read.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark all notifications as read.');
        } finally {
            setMarkingAllNotifications(false);
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

    const formatNotificationTime = (value) => {
        if (!value) return 'Just now';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Just now';
        return date.toLocaleString();
    };

    const dashboardStats = [
        {
            label: 'Unread notifications',
            value: unreadNotifications,
            note: notificationLiveStatus === 'live' ? 'Live updates connected' : 'Polling fallback active',
            icon: <FiBell />,
        },
        {
            label: 'My enrolled courses',
            value: enrolledCourseIds.length,
            note: 'Continue learning from your dashboard',
            icon: <FiBookOpen />,
        },
        {
            label: 'Available courses',
            value: courses.length,
            note: 'Choose a topic and enroll quickly',
            icon: <FiMap />,
        },
        {
            label: 'Live news items',
            value: news.length,
            note: news[0]?.source?.name ? `Latest from ${news[0].source.name}` : 'Real-world updates when available',
            icon: <FiAlertTriangle />,
        },
    ];

    const renderNotificationSkeleton = () => (
        <div className="notification-list">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={`notification-skeleton-${index}`} className="notification-skeleton" />
            ))}
        </div>
    );

    return (
        <div className="student-home smooth-reveal">
            <section className="dashboard-hero section-shell">
                <div className="dashboard-hero-main">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title text-3xl font-bold flex items-center gap-2">Welcome, {user?.name}!</h1>
                            <p className="subtitle text-slate-500 mt-1 dark:text-slate-400">
                                Learn what to do, watch live risks near you, and stay ready for updates.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-stat-grid">
                        {dashboardStats.map((item) => (
                            <article key={item.label} className="dashboard-stat-card">
                                <div className="dashboard-stat-head">
                                    <span>{item.label}</span>
                                    <i>{item.icon}</i>
                                </div>
                                <strong>{item.value}</strong>
                                <p>{item.note}</p>
                            </article>
                        ))}
                    </div>
                </div>

                <aside className="dashboard-hero-side">
                    <p className="dashboard-side-label">Recommended next step</p>
                    <h2>Open the live disaster map before starting your day.</h2>
                    <p>
                        The map now combines actual incident feeds, weather risk signals, and related news so you can
                        understand what is happening around a chosen location.
                    </p>
                    <Link to="/student/map" className="btn btn-primary">
                        Open Live Map <FiAlertTriangle />
                    </Link>
                </aside>
            </section>

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

            <section className="section section-shell my-10 smooth-reveal">
                <div className="notification-header">
                    <h2 className="section-title text-xl font-bold flex items-center gap-2 dark:text-white">
                        <FiBell className="text-primary" /> Recent Notifications
                    </h2>
                    <div className="notification-header-actions">
                        <span className={`notification-unread-pill ${unreadNotifications > 0 ? 'unread' : ''}`}>
                            {unreadNotifications} unread
                        </span>
                        <span className={`notification-live-pill ${notificationLiveStatus}`}>
                            <FiActivity />
                            {notificationLiveStatus === 'live'
                                ? 'Live'
                                : notificationLiveStatus === 'reconnecting'
                                  ? 'Reconnecting'
                                  : notificationLiveStatus === 'offline'
                                    ? 'Offline'
                                    : 'Connecting'}
                        </span>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => fetchNotifications()}
                            disabled={loadingNotifications}
                        >
                            <FiRefreshCw /> Refresh
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleMarkAllNotificationsRead}
                            disabled={markingAllNotifications || unreadNotifications === 0}
                        >
                            <FiCheckCircle /> {markingAllNotifications ? 'Marking...' : 'Mark all read'}
                        </button>
                    </div>
                </div>

                <p className="notification-subtitle text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Real-time push is enabled with a 60-second polling fallback.
                </p>

                {loadingNotifications ? (
                    renderNotificationSkeleton()
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <FiBell />
                        <p>No notification updates yet. New teacher actions will appear here.</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <article
                                key={notification._id}
                                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                            >
                                <div className="notification-main">
                                    <h3>{notification.title}</h3>
                                    <p>{notification.message}</p>
                                    <div className="notification-meta">
                                        <span><FiClock /> {formatNotificationTime(notification.createdAt)}</span>
                                        {notification.actor?.name ? <span>By {notification.actor.name}</span> : null}
                                        {!notification.isRead ? <span className="notification-dot">New</span> : null}
                                    </div>
                                </div>
                                <div className="notification-actions">
                                    {notification.meta?.route ? (
                                        <Link className="btn btn-outline btn-sm" to={notification.meta.route}>
                                            Open <FiExternalLink />
                                        </Link>
                                    ) : null}
                                    {!notification.isRead ? (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleMarkNotificationRead(notification._id)}
                                            disabled={markingNotificationId === notification._id}
                                        >
                                            {markingNotificationId === notification._id ? 'Saving...' : 'Mark read'}
                                        </button>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="section section-shell my-10 smooth-reveal">
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

            <section className="section section-shell my-10 smooth-reveal">
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

            <section className="section section-shell my-10 smooth-reveal">
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
                <section className="section section-shell my-10 smooth-reveal">
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
