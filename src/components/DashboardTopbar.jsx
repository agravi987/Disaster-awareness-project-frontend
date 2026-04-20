import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FiActivity,
    FiBookOpen,
    FiCalendar,
    FiClipboard,
    FiMap,
    FiRefreshCw,
    FiZap,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './DashboardTopbar.css';

const PAGE_TITLES = {
    student: {
        '/student': 'Student Home',
        '/student/map': 'Live Disaster Map',
        '/student/learning': 'My Learning',
        '/student/quizzes': 'Assigned Quizzes',
    },
    teacher: {
        '/teacher': 'Teacher Dashboard',
        '/teacher/map': 'Live Disaster Map',
        '/teacher/students': 'Student Management',
        '/teacher/groups': 'Group Management',
        '/teacher/courses': 'Course Management',
        '/teacher/quizzes': 'Quiz Management',
    },
};

const ROLE_QUICK_LINKS = {
    student: [
        { label: 'Map', to: '/student/map', icon: <FiMap /> },
        { label: 'Learning', to: '/student/learning', icon: <FiBookOpen /> },
        { label: 'Quizzes', to: '/student/quizzes', icon: <FiClipboard /> },
    ],
    teacher: [
        { label: 'Courses', to: '/teacher/courses', icon: <FiBookOpen /> },
        { label: 'Quizzes', to: '/teacher/quizzes', icon: <FiClipboard /> },
        { label: 'Map', to: '/teacher/map', icon: <FiMap /> },
    ],
};

const PREPAREDNESS_TIPS = [
    'Save two emergency contacts in your phone and notebook.',
    'Keep a 3-day water and dry-food backup kit at home.',
    'Check your family meeting point once every month.',
    'Store IDs and medical papers in a waterproof folder.',
    'Keep a torch, power bank, and first aid kit ready.',
    'Practice a 5-minute evacuation drill with your group.',
];

const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const day = Math.floor(diff / 86400000);
    return day;
};

const resolvePageTitle = (role, pathname) => {
    const titleMap = PAGE_TITLES[role] || {};
    if (titleMap[pathname]) return titleMap[pathname];

    const matched = Object.entries(titleMap).find(([path]) => pathname.startsWith(path));
    if (matched) return matched[1];

    return role === 'teacher' ? 'Teacher Portal' : 'Student Portal';
};

function DashboardTopbar({ role }) {
    const { user } = useAuth();
    const location = useLocation();
    const [tipIndex, setTipIndex] = useState(() => getDayOfYear(new Date()) % PREPAREDNESS_TIPS.length);

    const pageTitle = useMemo(
        () => resolvePageTitle(role, location.pathname),
        [location.pathname, role]
    );

    const quickLinks = ROLE_QUICK_LINKS[role] || [];
    const topbarLabel = role === 'teacher' ? 'Teacher Workspace' : 'Student Workspace';
    const dateLabel = new Date().toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <header className={`dashboard-topbar dashboard-topbar-${role} smooth-reveal`}>
            <div className="dashboard-topbar-main">
                <p className="dashboard-topbar-kicker">{topbarLabel}</p>
                <h2 className="dashboard-topbar-title">{pageTitle}</h2>
                <p className="dashboard-topbar-meta">
                    <span><FiCalendar /> {dateLabel}</span>
                    <span><FiActivity /> {user?.name || 'Member'}</span>
                </p>
            </div>

            <div className="dashboard-topbar-side">
                <div className="dashboard-topbar-links">
                    {quickLinks.map((item) => (
                        <Link key={item.to} className="dashboard-chip-link" to={item.to}>
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="dashboard-tip-card">
                    <div className="dashboard-tip-main">
                        <span className="dashboard-tip-icon"><FiZap /></span>
                        <p>{PREPAREDNESS_TIPS[tipIndex]}</p>
                    </div>
                    <button
                        type="button"
                        className="dashboard-tip-refresh"
                        onClick={() => setTipIndex((prev) => (prev + 1) % PREPAREDNESS_TIPS.length)}
                        aria-label="Show next preparedness tip"
                        title="Next tip"
                    >
                        <FiRefreshCw />
                    </button>
                </div>

                <div className="dashboard-topbar-controls">
                    <span className="dashboard-shortcut-hint">Press N for notifications</span>
                    <NotificationBell />
                </div>
            </div>
        </header>
    );
}

export default DashboardTopbar;
