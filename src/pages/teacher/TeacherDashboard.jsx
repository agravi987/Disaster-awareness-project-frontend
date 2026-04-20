/**
 * src/pages/teacher/TeacherDashboard.jsx - Teacher Overview Page
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getStudents,
    getCourses,
    getQuizzes,
    getGroups,
    getMyNotificationActivity,
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import {
    FiPlusSquare,
    FiEdit,
    FiUsers,
    FiMap,
    FiBell,
    FiClock,
    FiRefreshCw,
    FiExternalLink,
    FiCheckCircle,
    FiActivity,
} from 'react-icons/fi';
import './TeacherDashboard.css';

function TeacherDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [stats, setStats] = useState({
        students: 0,
        groups: 0,
        courses: 0,
        quizzes: 0,
    });
    const [loading, setLoading] = useState(true);

    const [activity, setActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [refreshingActivity, setRefreshingActivity] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [refreshingAlerts, setRefreshingAlerts] = useState(false);
    const [markingAlertId, setMarkingAlertId] = useState(null);
    const [markingAllAlerts, setMarkingAllAlerts] = useState(false);
    const [unreadAlerts, setUnreadAlerts] = useState(0);
    const [alertsLiveStatus, setAlertsLiveStatus] = useState('connecting');

    const fetchActivity = async ({ silent = false } = {}) => {
        if (!silent) setLoadingActivity(true);
        if (silent) setRefreshingActivity(true);
        try {
            const { data } = await getMyNotificationActivity({ limit: 8 });
            setActivity(data.activity || []);
        } catch (err) {
            console.error('Failed to load notification activity', err);
        } finally {
            if (!silent) setLoadingActivity(false);
            if (silent) setRefreshingActivity(false);
        }
    };

    const fetchAlerts = async ({ silent = false } = {}) => {
        if (!silent) setLoadingAlerts(true);
        if (silent) setRefreshingAlerts(true);
        try {
            const { data } = await getMyNotifications({ limit: 10 });
            setAlerts(data.notifications || []);
            setUnreadAlerts(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to load teacher alerts', err);
        } finally {
            if (!silent) setLoadingAlerts(false);
            if (silent) setRefreshingAlerts(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [stRes, grRes, crRes, qzRes] = await Promise.all([
                    getStudents(),
                    getGroups(),
                    getCourses(),
                    getQuizzes(),
                ]);

                const myCourses = crRes.data.filter(
                    (course) => course.teacher?._id === user._id || course.teacher === user._id
                );

                setStats({
                    students: stRes.data.length,
                    groups: grRes.data.length,
                    courses: myCourses.length,
                    quizzes: qzRes.data.length,
                });
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        fetchActivity();
        fetchAlerts();

        const pollTimer = setInterval(() => {
            fetchActivity({ silent: true });
            fetchAlerts({ silent: true });
        }, 60000);

        return () => clearInterval(pollTimer);
    }, [user._id]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setAlertsLiveStatus('offline');
            return;
        }

        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const streamUrl = `${base}/notifications/stream?token=${encodeURIComponent(token)}`;
        let source = null;
        let reconnectTimer = null;

        const connect = () => {
            setAlertsLiveStatus('connecting');
            source = new EventSource(streamUrl);

            source.onopen = () => {
                setAlertsLiveStatus('live');
            };

            source.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data || '{}');
                    if (payload.type === 'notification:new') {
                        fetchAlerts({ silent: true });
                        fetchActivity({ silent: true });

                        if (['course_completed', 'quiz_submitted'].includes(payload.notification?.kind)) {
                            toast.info(payload.notification?.title || 'New student update received');
                        }
                    }
                } catch {
                    // ignore malformed stream payload
                }
            };

            source.onerror = () => {
                setAlertsLiveStatus('reconnecting');
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

    const handleMarkAlertRead = async (notificationId) => {
        setMarkingAlertId(notificationId);
        try {
            const { data } = await markNotificationRead(notificationId);
            setUnreadAlerts(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
            setAlerts((prev) =>
                prev.map((item) =>
                    item._id === notificationId ? { ...item, isRead: true } : item
                )
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark alert as read.');
        } finally {
            setMarkingAlertId(null);
        }
    };

    const handleMarkAllAlertsRead = async () => {
        setMarkingAllAlerts(true);
        try {
            await markAllNotificationsRead();
            setUnreadAlerts(0);
            setAlerts((prev) => prev.map((item) => ({ ...item, isRead: true })));
            toast.success('All alerts marked as read.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark all alerts as read.');
        } finally {
            setMarkingAllAlerts(false);
        }
    };

    const formatTime = (value) => {
        if (!value) return 'Unknown time';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Unknown time';
        return date.toLocaleString();
    };

    const liveLabel =
        alertsLiveStatus === 'live'
            ? 'Live'
            : alertsLiveStatus === 'reconnecting'
                ? 'Reconnecting'
                : alertsLiveStatus === 'offline'
                    ? 'Offline'
                    : 'Connecting';

    const overviewCards = [
        {
            label: 'Students',
            value: stats.students,
            note: 'Learners assigned to your workspace',
        },
        {
            label: 'Groups',
            value: stats.groups,
            note: 'Ready for targeted assignments',
        },
        {
            label: 'Courses',
            value: stats.courses,
            note: 'Learning paths you currently manage',
        },
        {
            label: 'Unread alerts',
            value: unreadAlerts,
            note: liveLabel === 'Live' ? 'Live updates connected' : 'Refresh recommended',
        },
    ];

    return (
        <div className="teacher-dashboard smooth-reveal">
            {loading ? (
                <div className="spinner" />
            ) : (
                <>
                    <section className="card teacher-hero smooth-reveal">
                        <div className="teacher-hero-main">
                            <div className="page-header">
                                <div>
                                    <h1 className="page-title">Welcome to Educator Portal</h1>
                                    <p className="subtitle">
                                        Manage learning, track readiness, and use the live disaster map as an operational context tool.
                                    </p>
                                </div>
                            </div>

                            <div className="grid-4 teacher-stats-grid">
                                {overviewCards.map((card, index) => (
                                    <div
                                        key={card.label}
                                        className={`card teacher-stat-card ${index === 0 ? 'info' : index === 1 ? 'warning' : index === 2 ? 'success' : 'primary'}`}
                                    >
                                        <p className="teacher-stat-label">{card.label}</p>
                                        <p className="teacher-stat-value">{card.value}</p>
                                        <p className="teacher-stat-note">{card.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="teacher-hero-side">
                            <p className="teacher-side-label">Recommended next step</p>
                            <h2>Review the live map before sending course or safety updates.</h2>
                            <p>
                                The map now highlights actual incident data, weather risk signals, and related news so
                                classroom communication can match current conditions.
                            </p>
                            <Link to="/teacher/map" className="btn btn-primary">
                                <FiMap /> Open Live Disaster Map
                            </Link>
                        </aside>
                    </section>

                    <section className="card teacher-panel smooth-reveal">
                        <div className="teacher-panel-head">
                            <h2 className="teacher-panel-title">Quick Actions</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/teacher/courses" className="btn btn-primary"><FiPlusSquare /> Create New Course</Link>
                            <Link to="/teacher/quizzes" className="btn btn-primary"><FiEdit /> Create Quiz</Link>
                            <Link to="/teacher/groups" className="btn btn-outline"><FiUsers /> Form a Group</Link>
                            <Link to="/teacher/map" className="btn btn-outline"><FiMap /> Review Live Disaster Map</Link>
                        </div>
                    </section>

                    <section className="card teacher-panel smooth-reveal">
                        <div className="teacher-panel-head">
                            <h2 className="teacher-panel-title inline-flex items-center gap-2">
                                <FiBell /> Student Completion Alerts
                            </h2>
                            <div className="teacher-pill-row">
                                <span className={`teacher-pill ${liveLabel === 'Live' ? 'critical' : 'normal'}`}>
                                    <FiActivity /> {liveLabel}
                                </span>
                                <span className={`teacher-pill ${unreadAlerts > 0 ? 'critical' : 'normal'}`}>
                                    {unreadAlerts} unread
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => fetchAlerts({ silent: true })}
                                    disabled={refreshingAlerts}
                                >
                                    <FiRefreshCw /> {refreshingAlerts ? 'Refreshing...' : 'Refresh'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleMarkAllAlertsRead}
                                    disabled={markingAllAlerts || unreadAlerts === 0}
                                >
                                    <FiCheckCircle /> {markingAllAlerts ? 'Marking...' : 'Mark all read'}
                                </button>
                            </div>
                        </div>

                        <p className="teacher-muted">
                            Real-time updates appear when students complete courses or submit quizzes.
                        </p>

                        {loadingAlerts ? (
                            <div className="space-y-3 mt-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={`alerts-skeleton-${index}`} className="h-14 rounded-lg bg-slate-200 dark:bg-slate-700/50 animate-pulse" />
                                ))}
                            </div>
                        ) : alerts.length === 0 ? (
                            <p className="teacher-muted mt-4">No student alerts yet.</p>
                        ) : (
                            <div className="space-y-3 mt-4">
                                {alerts.map((item) => (
                                    <article
                                        key={item._id}
                                        className={`teacher-alert-card ${item.isRead ? '' : 'unread'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                            <div>
                                                <h3 className="teacher-alert-title">{item.title}</h3>
                                                <p className="teacher-alert-body">{item.message}</p>
                                                <div className="teacher-meta-row">
                                                    <span><FiClock /> {formatTime(item.createdAt)}</span>
                                                    {item.actor?.name ? <span>By {item.actor.name}</span> : null}
                                                    {!item.isRead ? <span className="teacher-pill critical">New</span> : null}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {item.meta?.route ? (
                                                    <Link to={item.meta.route} className="btn btn-outline btn-sm">
                                                        Open <FiExternalLink />
                                                    </Link>
                                                ) : null}
                                                {!item.isRead ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleMarkAlertRead(item._id)}
                                                        disabled={markingAlertId === item._id}
                                                    >
                                                        {markingAlertId === item._id ? 'Saving...' : 'Mark read'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="card teacher-panel smooth-reveal">
                        <div className="teacher-panel-head">
                            <h2 className="teacher-panel-title inline-flex items-center gap-2">
                                <FiBell /> Recent Updates Sent
                            </h2>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => fetchActivity({ silent: true })}
                                disabled={refreshingActivity}
                            >
                                <FiRefreshCw /> {refreshingActivity ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {loadingActivity ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={`activity-skeleton-${index}`} className="h-14 rounded-lg bg-slate-200 dark:bg-slate-700/50 animate-pulse" />
                                ))}
                            </div>
                        ) : activity.length === 0 ? (
                            <p className="teacher-muted">
                                No activity yet. Create or assign a course/quiz to generate student notifications.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((item) => (
                                    <article key={item._id} className="teacher-activity-card">
                                        <h3 className="teacher-activity-title">{item.title}</h3>
                                        <p className="teacher-activity-body">{item.message}</p>
                                        <div className="teacher-meta-row">
                                            <span><FiClock /> {formatTime(item.createdAt)}</span>
                                            <span>Recipients: {item.totalRecipients}</span>
                                            <span>Unread: {item.unreadRecipients}</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default TeacherDashboard;
