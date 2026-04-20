import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiAlertCircle,
    FiBell,
    FiBookOpen,
    FiCheck,
    FiCheckCircle,
    FiClipboard,
    FiClock,
    FiRefreshCw,
    FiXCircle,
} from 'react-icons/fi';
import {
    getMyNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../services/api';
import { useToast } from './Toast';
import './NotificationBell.css';

const getNotificationIcon = (kind) => {
    if (kind?.startsWith('course')) return FiBookOpen;
    if (kind?.startsWith('quiz')) return FiClipboard;
    return FiAlertCircle;
};

const formatNotificationTime = (value) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString();
};

function NotificationBell() {
    const { toast } = useToast();
    const wrapperRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingId, setMarkingId] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [liveStatus, setLiveStatus] = useState('connecting');

    const fetchNotifications = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);
        try {
            const { data } = await getMyNotifications({ limit: 10 });
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to load notifications.');
            }
        } finally {
            if (!silent) setLoading(false);
            if (silent) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const pollTimer = setInterval(() => {
            fetchNotifications({ silent: true });
        }, 60000);
        return () => clearInterval(pollTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLiveStatus('offline');
            return undefined;
        }

        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const streamUrl = `${base}/notifications/stream?token=${encodeURIComponent(token)}`;
        let source = null;
        let reconnectTimer = null;

        const connect = () => {
            setLiveStatus('connecting');
            source = new EventSource(streamUrl);

            source.onopen = () => setLiveStatus('live');
            source.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data || '{}');
                    if (payload.type === 'notification:new') {
                        fetchNotifications({ silent: true });
                    }
                } catch {
                    // ignore malformed stream message
                }
            };
            source.onerror = () => {
                setLiveStatus('reconnecting');
                source?.close();
                reconnectTimer = setTimeout(connect, 4000);
            };
        };

        connect();

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            source?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onOutsideClick = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const onShortcut = (event) => {
            const target = event.target;
            const tagName = target?.tagName?.toLowerCase() || '';
            const isTyping = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName);
            if (isTyping) return;

            if (event.key === 'n' || event.key === 'N') {
                event.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        document.addEventListener('mousedown', onOutsideClick);
        window.addEventListener('keydown', onShortcut);
        return () => {
            document.removeEventListener('mousedown', onOutsideClick);
            window.removeEventListener('keydown', onShortcut);
        };
    }, []);

    const visibleNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter((item) => !item.isRead);
        }
        return notifications;
    }, [filter, notifications]);

    const handleMarkOneRead = async (id) => {
        if (!id) return;
        setMarkingId(id);
        try {
            const { data } = await markNotificationRead(id);
            setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
            setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not mark notification as read.');
        } finally {
            setMarkingId(null);
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not mark all as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const liveLabel =
        liveStatus === 'live'
            ? 'Live'
            : liveStatus === 'reconnecting'
                ? 'Reconnecting'
                : liveStatus === 'offline'
                    ? 'Offline'
                    : 'Connecting';

    return (
        <div className="notification-bell-wrap" ref={wrapperRef}>
            <button
                type="button"
                className={`notification-bell-btn ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Open recent notifications"
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <FiBell />
                {unreadCount > 0 ? <span className="notification-badge">{Math.min(unreadCount, 99)}</span> : null}
            </button>

            {open ? (
                <section className="notification-dropdown smooth-reveal">
                    <header className="notification-dropdown-head">
                        <div>
                            <h3>Recent Notifications</h3>
                            <p className={`notification-live-state ${liveStatus}`}>{liveLabel}</p>
                        </div>
                        <div className="notification-dropdown-actions">
                            <button
                                type="button"
                                className="bell-action-btn"
                                onClick={() => fetchNotifications({ silent: true })}
                                disabled={refreshing}
                                title="Refresh notifications"
                            >
                                <FiRefreshCw />
                            </button>
                            <button
                                type="button"
                                className="bell-action-btn"
                                onClick={handleMarkAllRead}
                                disabled={markingAll || unreadCount === 0}
                                title="Mark all as read"
                            >
                                <FiCheckCircle />
                            </button>
                        </div>
                    </header>

                    <div className="notification-filter-row">
                        <button
                            type="button"
                            className={`bell-chip ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`bell-chip ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {loading ? (
                        <div className="notification-dropdown-skeleton">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={`bell-skeleton-${index}`} className="notification-skeleton-item" />
                            ))}
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="notification-empty-state">
                            <FiXCircle />
                            <p>No notifications in this filter.</p>
                        </div>
                    ) : (
                        <div className="notification-list-mini">
                            {visibleNotifications.map((item) => {
                                const Icon = getNotificationIcon(item.kind);
                                return (
                                    <article key={item._id} className={`notification-mini-item ${item.isRead ? '' : 'unread'}`}>
                                        <div className="notification-mini-main">
                                            <p className="notification-mini-title">
                                                <Icon />
                                                {item.title}
                                            </p>
                                            <p className="notification-mini-body">{item.message}</p>
                                            <p className="notification-mini-time">
                                                <FiClock />
                                                {formatNotificationTime(item.createdAt)}
                                            </p>
                                        </div>
                                        <div className="notification-mini-actions">
                                            {item.meta?.route ? (
                                                <Link className="bell-link-btn" to={item.meta.route} onClick={() => setOpen(false)}>
                                                    Open
                                                </Link>
                                            ) : null}
                                            {!item.isRead ? (
                                                <button
                                                    type="button"
                                                    className="bell-link-btn"
                                                    onClick={() => handleMarkOneRead(item._id)}
                                                    disabled={markingId === item._id}
                                                    title="Mark as read"
                                                >
                                                    {markingId === item._id ? <FiRefreshCw /> : <FiCheck />}
                                                </button>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            ) : null}
        </div>
    );
}

export default NotificationBell;
